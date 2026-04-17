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

export async function POST(req: Request) {
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

  const model =
    typeof requestedModel === 'string' && requestedModel.trim().length > 0
      ? requestedModel.trim()
      : 'gemini-2.5-flash'

  if (!SUPPORTED_MODELS.has(model)) {
    return jsonResponse({ error: 'Unsupported model', model }, { status: 400 })
  }

  let modelMessages
  try {
    modelMessages = await convertToModelMessages(messages)
  } catch {
    return jsonResponse({ error: 'Invalid messages payload' }, { status: 400 })
  }

  let providerModel
  if (model.startsWith('gemini-')) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return jsonResponse(
        { error: 'Missing GOOGLE_GENERATIVE_AI_API_KEY' },
        { status: 501 },
      )
    }
    providerModel = google(model)
  } else if (model.startsWith('gpt-')) {
    if (!process.env.OPENAI_API_KEY) {
      return jsonResponse({ error: 'Missing OPENAI_API_KEY' }, { status: 501 })
    }
    providerModel = openai(model)
  } else if (model.startsWith('claude-')) {
    if (!process.env.ANTHROPIC_API_KEY) {
      return jsonResponse(
        { error: 'Missing ANTHROPIC_API_KEY' },
        { status: 501 },
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
