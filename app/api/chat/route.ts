import { timingSafeEqual } from 'node:crypto'
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

const calculateTool = tool({
  description:
    'Evaluates a mathematical expression as a plain numeric string (e.g. arithmetic, percentages rewritten as decimals like 0.15 * 320). Use when the user asks for a calculation, numeric result, or "how much is X% of Y" after rewriting to an expression the evaluator can parse. Do not use for non-math requests.',
  inputSchema: jsonSchema<{ expression: string }>({
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description:
          'The expression to evaluate, using standard arithmetic notation (numbers, + - * / parentheses).',
      },
    },
    required: ['expression'],
    additionalProperties: false,
  }),
  execute: async ({ expression }) => {
    try {
      if (expression === undefined || expression === null) {
        return 'Could not evaluate: missing expression.'
      }
      if (typeof expression !== 'string') {
        return 'Could not evaluate: expression must be a string.'
      }
      const value = evaluateMathExpressionTutorial(expression)
      if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
          return 'Could not evaluate: result is not a finite number (e.g. division by zero or overflow).'
        }
        return String(value)
      }
      if (typeof value === 'bigint') {
        return String(value)
      }
      return `Could not evaluate: expected a numeric result, got ${typeof value}.`
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error during evaluation.'
      return `Could not evaluate: ${message}`
    }
  },
})

/** Server chat tools map; `calculate` is the first and only tool for this slice. */
const chatTools = {
  calculate: calculateTool,
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
    tools: chatTools,
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
