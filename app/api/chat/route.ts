import { timingSafeEqual } from 'node:crypto'
import { streamText, convertToModelMessages } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'

const SUPPORTED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gpt-4.1',
  'claude-sonnet-4-20250514',
])

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init?.headers ?? {}),
    },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidChatMessage(value: unknown): boolean {
  if (!isRecord(value)) return false
  const role = value.role
  return role === 'user' || role === 'assistant' || role === 'system'
}

function getBearerToken(authorization: string | null): string | null {
  if (!authorization || !authorization.startsWith('Bearer ')) return null
  const token = authorization.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

function isAuthorizedChatRequest(req: Request): boolean {
  const secret = process.env.CHAT_API_SECRET
  if (!secret) return false
  const token = getBearerToken(req.headers.get('authorization'))
  if (!token) return false
  const a = Buffer.from(token, 'utf8')
  const b = Buffer.from(secret, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(req: Request) {
  const secretConfirmed =
    typeof process.env.CHAT_API_SECRET === 'string' &&
    process.env.CHAT_API_SECRET.length > 0
  if (!secretConfirmed) {
    return jsonResponse({ error: 'Service unavailable' }, { status: 503 })
  }
  if (!isAuthorizedChatRequest(req)) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Malformed JSON body' }, { status: 400 })
  }

  if (!isRecord(body)) {
    return jsonResponse({ error: 'Invalid request body' }, { status: 400 })
  }

  const messages = body.messages
  const requestedModel = body.model

  if (!Array.isArray(messages) || !messages.every(isValidChatMessage)) {
    return jsonResponse({ error: 'Invalid messages payload' }, { status: 400 })
  }

  const messagesWithoutSystem = messages.filter(
    (m) => isRecord(m) && m.role !== 'system',
  )

  if (messagesWithoutSystem.length === 0) {
    return jsonResponse({ error: 'Invalid messages payload' }, { status: 400 })
  }

  const model =
    typeof requestedModel === 'string' && requestedModel.trim().length > 0
      ? requestedModel.trim()
      : 'gemini-2.5-flash'

  if (!SUPPORTED_MODELS.has(model)) {
    return jsonResponse({ error: 'Unsupported model', model }, { status: 400 })
  }

  let modelMessages
  try {
    modelMessages = await convertToModelMessages(messagesWithoutSystem)
  } catch {
    return jsonResponse({ error: 'Invalid messages payload' }, { status: 400 })
  }

  let providerModel
  if (model.startsWith('gemini-')) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return jsonResponse(
        { error: 'Missing GOOGLE_GENERATIVE_AI_API_KEY' },
        { status: 503 },
      )
    }
    providerModel = google(model)
  } else if (model.startsWith('gpt-')) {
    if (!process.env.OPENAI_API_KEY) {
      return jsonResponse({ error: 'Missing OPENAI_API_KEY' }, { status: 503 })
    }
    providerModel = openai(model)
  } else if (model.startsWith('claude-')) {
    if (!process.env.ANTHROPIC_API_KEY) {
      return jsonResponse(
        { error: 'Missing ANTHROPIC_API_KEY' },
        { status: 503 },
      )
    }
    providerModel = anthropic(model)
  } else {
    return jsonResponse({ error: 'Unsupported model', model }, { status: 400 })
  }

  const result = streamText({
    model: providerModel,
    messages: modelMessages,
  })

  return result.toUIMessageStreamResponse()
}
