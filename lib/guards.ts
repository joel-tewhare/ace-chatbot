import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

/** Runtime validation for a single chat user text segment (used by `guardInput`). */
export const UserInput = z.object({
  text: z.string().min(1).max(4000),
})

const MODERATION_MODEL = 'gemini-2.5-flash'

/** Gemini must use only these reason strings (lowercased when validated). */
const MODERATION_REASONS = new Set([
  'ok',
  'unsafe_content',
  'moderation_uncertain',
])

export const JAILBREAK =
  /ignore\s+(all\s+|previous\s+|above\s+|the\s+)*(instructions|rules|prompt)|reveal\s+(the\s+)?(system|developer)\s+prompt/i

export const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g
export const PHONE = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g

export type GuardTelemetry = {
  status: 'allowed' | 'redacted'
  moderationChecked: boolean
  redactionCount: number
  redactionTypes: string[]
}

export type GuardInputResult = {
  text: string
  telemetry: GuardTelemetry
}

export class GuardError extends Error {
  readonly code: string
  readonly httpStatus: number

  constructor(code: string, message: string, httpStatus = 400) {
    super(message)
    this.name = 'GuardError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function redactPii(text: string): string {
  return text.replace(EMAIL, '[EMAIL]').replace(PHONE, '[PHONE]')
}

/** Count PII matches before redaction for coarse telemetry only (no content captured). */
function countRedactionStats(text: string): {
  redactionCount: number
  redactionTypes: string[]
} {
  const emailMatches = text.match(EMAIL) ?? []
  const phoneMatches = text.match(PHONE) ?? []
  const redactionTypes: string[] = []
  if (emailMatches.length > 0) redactionTypes.push('email')
  if (phoneMatches.length > 0) redactionTypes.push('phone')
  return {
    redactionCount: emailMatches.length + phoneMatches.length,
    redactionTypes,
  }
}

/** Strip optional ``` / ```json fences if the model wrapped JSON. */
function unwrapMarkdownFence(s: string): string {
  const t = s.trim()
  if (!t.startsWith('```')) {
    return t
  }
  const firstNl = t.indexOf('\n')
  const close = t.lastIndexOf('```')
  if (firstNl === -1 || close <= firstNl) {
    return t
  }
  return t.slice(firstNl + 1, close).trim()
}

/** First top-level `{ ... }` by brace depth (moderation JSON is small and shallow). */
function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf('{')
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < s.length; i++) {
    const ch = s[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return s.slice(start, i + 1)
    }
  }
  return null
}

function parseModerationJson(raw: string): { safe: boolean; reason: string } {
  let t = raw.trim()
  t = unwrapMarkdownFence(t)
  const candidate = extractFirstJsonObject(t)
  if (!candidate) {
    throw new Error('no_json_object')
  }
  const parsed: unknown = JSON.parse(candidate)
  if (!isRecord(parsed) || typeof parsed.safe !== 'boolean') {
    throw new Error('invalid_shape')
  }
  const reasonRaw = parsed.reason
  if (typeof reasonRaw !== 'string') {
    throw new Error('invalid_reason_type')
  }
  const reason = reasonRaw.trim().toLowerCase()
  if (reason.length === 0) {
    throw new Error('invalid_reason_empty')
  }
  if (!MODERATION_REASONS.has(reason)) {
    throw new Error('invalid_reason_value')
  }
  const safe = parsed.safe
  if (safe && reason !== 'ok') {
    throw new Error('reason_safe_mismatch')
  }
  if (!safe && reason !== 'unsafe_content' && reason !== 'moderation_uncertain') {
    throw new Error('reason_unsafe_mismatch')
  }
  return { safe, reason }
}

async function runGeminiModeration(
  text: string,
  kind: 'input' | 'output',
): Promise<void> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new GuardError(
      'moderation_unavailable',
      'Content verification is temporarily unavailable.',
      503,
    )
  }

  if (text.trim().length === 0) {
    throw new GuardError(
      'moderation_empty_text',
      'Content could not be verified.',
      400,
    )
  }

  const { text: rawOut } = await generateText({
    model: google(MODERATION_MODEL),
    temperature: 0,
    maxOutputTokens: 128,
    system: `You classify text for a general assistant (${kind} stage). Output exactly one compact JSON object and nothing else: no markdown, no code fences, no labels, no explanation, no trailing text.

Required shape (two keys only):
{"safe":true,"reason":"ok"}
or
{"safe":false,"reason":"unsafe_content"}
or
{"safe":false,"reason":"moderation_uncertain"}

Rules for "reason":
- Use "ok" only when "safe" is true.
- Use "unsafe_content" when clearly policy-violating (e.g. serious wrongdoing how-tos, malware, hate targeting protected groups, CSAM).
- Use "moderation_uncertain" when unsure or borderline.

Mark "safe": true for normal questions, coding, math, gibberish, base64-like noise, phone numbers or placeholder tokens alone, and harmless experimentation—unless it is clearly harmful.`,
    prompt: text,
  })

  let parsed: { safe: boolean; reason: string }
  try {
    parsed = parseModerationJson(rawOut)
  } catch {
    throw new GuardError(
      'moderation_parse_error',
      'Content could not be verified.',
      400,
    )
  }

  if (!parsed.safe) {
    throw new GuardError(
      'unsafe_content',
      'This content cannot be processed.',
      400,
    )
  }
}

/**
 * Validates input, blocks obvious jailbreak patterns, redacts PII, then runs Gemini moderation on redacted text.
 * Returns redacted text and coarse telemetry safe for Langfuse/OpenTelemetry (no content, PII, or moderation bodies).
 */
export async function guardInput(raw: string): Promise<GuardInputResult> {
  const parsed = UserInput.safeParse({ text: raw })
  if (!parsed.success) {
    throw new GuardError(
      'invalid_input',
      'Invalid message content.',
      400,
    )
  }
  let text = parsed.data.text
  if (JAILBREAK.test(text)) {
    throw new GuardError(
      'jailbreak_detected',
      'This message cannot be processed.',
      400,
    )
  }
  const { redactionCount, redactionTypes } = countRedactionStats(text)
  text = redactPii(text)
  if (text.trim().length === 0) {
    throw new GuardError(
      'invalid_input',
      'Invalid message content.',
      400,
    )
  }
  await runGeminiModeration(text, 'input')
  return {
    text,
    telemetry: {
      status: redactionCount > 0 ? 'redacted' : 'allowed',
      moderationChecked: true,
      redactionCount,
      redactionTypes,
    },
  }
}

/**
 * Runs Gemini moderation on model output. Returns the text if safe; throws `GuardError` if not.
 * Intended for non-streaming or buffered flows; streaming routes typically cannot call this per chunk without extra buffering.
 */
export async function guardOutput(text: string): Promise<string> {
  if (typeof text !== 'string') {
    throw new GuardError('invalid_output', 'Invalid output.', 400)
  }
  if (text.length === 0) {
    return text
  }
  const forModeration = redactPii(text)
  if (forModeration.trim().length === 0) {
    throw new GuardError('invalid_output', 'Invalid output.', 400)
  }
  await runGeminiModeration(forModeration, 'output')
  return text
}

/** Last user message with non-empty combined text parts (UI message shape from the AI SDK). */
export function extractLatestUserText(messages: unknown[]): {
  index: number
  text: string
} | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (!isRecord(m) || m.role !== 'user') continue
    const parts = m.parts
    if (!Array.isArray(parts)) continue
    const chunks: string[] = []
    for (const p of parts) {
      if (!isRecord(p) || p.type !== 'text') continue
      const t = p.text
      if (typeof t === 'string') chunks.push(t)
    }
    const text = chunks.join('')
    if (text.length > 0) {
      return { index: i, text }
    }
  }
  return null
}

/** Replace user message text parts with a single sanitized text part. */
export function replaceUserMessageText(
  messages: unknown[],
  index: number,
  sanitized: string,
): void {
  const m = messages[index]
  if (!isRecord(m) || m.role !== 'user') {
    throw new GuardError('invalid_messages', 'Invalid messages payload.', 400)
  }
  m.parts = [{ type: 'text', text: sanitized }]
}
