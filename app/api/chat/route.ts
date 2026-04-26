import { timingSafeEqual } from 'node:crypto'
import { readFile as readFileFromFs } from 'node:fs/promises'
import * as nodePath from 'node:path'
import {
  streamText,
  convertToModelMessages,
  tool,
  jsonSchema,
  stepCountIs,
} from 'ai'
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

/**
 * Tutorial-only evaluator: compiles `expression` with `Function` and runs it.
 * **Unsafe for production** (arbitrary code execution). Use a dedicated math parser or sandbox if exposing to real users.
 */
function evaluateMathExpressionTutorial(expression: string): unknown {
  const trimmed = expression.trim()
  if (!trimmed) {
    throw new Error('Expression is empty.')
  }
  let run: () => unknown
  try {
    run = new Function(`return (${trimmed})`) as () => unknown
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid expression syntax.')
    }
    throw error
  }
  try {
    return run()
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid expression syntax.')
    }
    if (error instanceof ReferenceError) {
      throw new Error(
        'Expression references an undefined name; use only numbers and arithmetic operators.',
      )
    }
    if (error instanceof RangeError) {
      throw new Error(
        error.message || 'Numeric overflow or out-of-range result.',
      )
    }
    throw error
  }
}

/** Tool result string prefix for failure paths (success returns a plain numeric string). */
const calculateToolError = (detail: string) => `Could not evaluate: ${detail}`

const calculateTool = tool({
  description:
    'Use for math-only questions where you need a precise numeric result: arithmetic, unit conversions written as numbers, or “how much is X% of Y” after you rewrite the percent as a decimal (e.g. 0.15 * 320). Pass one expression: numbers, + - * /, parentheses, ** if needed. Do not use for non-math, explanations without a numeric answer, or code execution.',
  inputSchema: jsonSchema<{ expression: string }>({
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description:
          'One mathematical expression. Natural-language (e.g. “15% of 320”) must be rewritten to a numeric expression before calling.',
      },
    },
    required: ['expression'],
    additionalProperties: false,
  }),
  execute: async ({ expression }) => {
    try {
      if (expression === undefined || expression === null) {
        return calculateToolError('missing expression.')
      }
      if (typeof expression !== 'string') {
        return calculateToolError('expression must be a string.')
      }
      const value = evaluateMathExpressionTutorial(expression)
      if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
          return calculateToolError(
            'result is not a finite number (e.g. division by zero or overflow).',
          )
        }
        return String(value)
      }
      if (typeof value === 'bigint') {
        return String(value)
      }
      return calculateToolError(
        `expected a numeric result, got ${typeof value}.`,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error during evaluation.'
      return calculateToolError(message)
    }
  },
})

/** Stable readFile failure categories for the model and user-facing copy. */
type ReadFileErrorCode =
  | 'invalid_input'
  | 'access_denied'
  | 'not_found'
  | 'not_readable'
  | 'permission_denied'
  | 'read_error'

type ReadFileToolResult =
  | { ok: true; content: string }
  | { ok: false; code: ReadFileErrorCode; message: string }

const READ_FILE_USER_MESSAGES: Record<ReadFileErrorCode, string> = {
  invalid_input: 'The file path is missing or invalid.',
  access_denied: 'That path is not available to read.',
  not_found: 'No file exists at that path.',
  not_readable: 'That path is not a readable text file.',
  permission_denied: 'The file could not be read because access was denied.',
  read_error: 'The file could not be read.',
}

function readFileToolFailure(code: ReadFileErrorCode): ReadFileToolResult {
  return { ok: false, code, message: READ_FILE_USER_MESSAGES[code] }
}

const readFileTool = tool({
  description:
    'Read a local text file when the user asks to see or analyze file contents. Supply the file path (relative to the app working directory or absolute). Returns a JSON object: { ok: true, content: string } on success (content may be "" for an empty file—do not say the file is missing). On failure returns { ok: false, code: string, message: string } with a short user-facing message; explain that failure to the user using message and do not pretend the file was read. Do not use for directory listing, writes, or non-text files.',
  inputSchema: jsonSchema<{ path: string }>({
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description:
          'Path to a single file to read as UTF-8 text. Relative paths resolve from the server working directory.',
      },
    },
    required: ['path'],
    additionalProperties: false,
  }),
  execute: async ({ path: filePath }): Promise<ReadFileToolResult> => {
    if (filePath === undefined || filePath === null) {
      return readFileToolFailure('invalid_input')
    }
    if (typeof filePath !== 'string') {
      return readFileToolFailure('invalid_input')
    }
    if (filePath.trim().length === 0) {
      return readFileToolFailure('invalid_input')
    }
    const resolved = nodePath.resolve(process.cwd(), filePath)
    const rel = nodePath.relative(process.cwd(), resolved)
    for (const part of rel.split(nodePath.sep)) {
      if (part === '.git' || part === 'node_modules') {
        return readFileToolFailure('access_denied')
      }
    }
    const base = nodePath.basename(resolved)
    if (base === '.env' || base.startsWith('.env.')) {
      return readFileToolFailure('access_denied')
    }
    try {
      const content = await readFileFromFs(resolved, { encoding: 'utf8' })
      if (content.includes('\0')) {
        return readFileToolFailure('not_readable')
      }
      return { ok: true, content }
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      if (err.code === 'ENOENT') {
        return readFileToolFailure('not_found')
      }
      if (err.code === 'EISDIR' || err.code === 'ENOTDIR') {
        return readFileToolFailure('not_readable')
      }
      if (err.code === 'EACCES' || err.code === 'EPERM') {
        return readFileToolFailure('permission_denied')
      }
      return readFileToolFailure('read_error')
    }
  },
})

/** Tools object passed to `streamText` — add future tools here with matching keys. */
const chatTools = {
  calculate: calculateTool,
  readFile: readFileTool,
} as const

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
    tools: chatTools,
    //5 = Tool call + at least one follow-up model step. Important to cap steps to limit runaway loops.
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
