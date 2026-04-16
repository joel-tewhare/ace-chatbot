import { streamText, convertToModelMessages } from 'ai'
import { google } from '@ai-sdk/google'

export async function POST(req: Request) {
  const body = await req.json()
  const messages = body?.messages ?? []

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
