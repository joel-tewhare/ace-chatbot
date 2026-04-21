'use client'

import { useChat } from '@ai-sdk/react'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

function getTextFromParts(parts: Array<any>): string {
  return parts
    .filter((p) => p?.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
}

export default function Chat() {
  const pendingMessageRef = useRef<string | null>(null)
  const currentInputRef = useRef('')

  const { messages, sendMessage, status, error, clearError } = useChat({
    onFinish: ({ isError }) => {
      if (isError) {
        pendingMessageRef.current = null
        return
      }

      const pending = pendingMessageRef.current
      if (!pending) return

      if (currentInputRef.current.trim() === pending) {
        setInput('')
      }

      pendingMessageRef.current = null
    },
  })
  const [input, setInput] = useState('')
  const [model, setModel] = useState('gemini-2.5-flash')

  useEffect(() => {
    currentInputRef.current = input
  }, [input])

  const isLoading = status === 'submitted' || status === 'streaming'
  const hasMessages = messages.length > 0
  const composerError = error?.message ?? null

  const renderedMessages = useMemo(() => {
    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      text: getTextFromParts(m.parts ?? []),
    }))
  }, [messages])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    clearError()
    pendingMessageRef.current = text
    await sendMessage(
      { text },
      {
        body: { model },
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CHAT_API_SECRET ?? ''}`,
        },
      },
    )
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#1F2937]">
      <div className="mx-auto flex h-screen max-w-3xl flex-col px-4 py-6">
        <header className="flex items-start justify-between gap-4 pb-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">
              ACE Chatbot
            </h1>
            <p className="mt-1 text-sm text-[#1F2937]/70">
              Multi-provider chat UI (model selection is wired end-to-end).
            </p>
          </div>

          <div className="w-48 shrink-0">
            <label
              htmlFor="model"
              className="block text-xs font-medium text-[#1F2937]/70"
            >
              Model
            </label>
            <select
              id="model"
              name="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#1F2937]/15 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-offset-2 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
            </select>
          </div>
        </header>

        <section
          aria-label="Messages"
          className="flex-1 overflow-hidden rounded-xl border border-[#1F2937]/10 bg-white shadow-sm"
        >
          <div className="h-full overflow-y-auto px-4 py-5">
            {!hasMessages ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-sm rounded-lg border border-[#1F2937]/10 bg-[#F9FAFB] px-4 py-3 text-center text-sm text-[#1F2937]/70">
                  No messages yet. Send your first prompt below.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {renderedMessages.map((m) => {
                  const isUser = m.role === 'user'
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={[
                          'max-w-[85%] whitespace-pre-wrap px-4 py-3 text-sm shadow-sm',
                          isUser
                            ? 'rounded-2xl rounded-br-md bg-[#3B82F6] text-white'
                            : 'rounded-2xl rounded-bl-md bg-[#1F2937]/5 text-[#1F2937]',
                        ].join(' ')}
                      >
                        {m.text || (
                          <span className="text-[#1F2937]/60">
                            (non-text content)
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {isLoading ? (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#1F2937]/5 px-4 py-3 text-sm text-[#1F2937]/70 shadow-sm">
                      Thinking…
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <form onSubmit={onSubmit}>
          <section
            aria-label="Composer"
            className="mt-4 rounded-xl border border-[#1F2937]/10 bg-white p-3 shadow-sm"
          >
            {composerError ? (
              <div className="mb-3 rounded-md border border-[#3B82F6]/25 bg-[#3B82F6]/10 px-3 py-2 text-sm text-[#1F2937]">
                <div className="font-semibold">Couldn’t send message</div>
                <div className="mt-0.5 text-[#1F2937]/80">{composerError}</div>
                <div className="mt-1 text-xs text-[#1F2937]/70">
                  Check your API keys in <code>.env.local</code> (or your
                  network) and try again.
                </div>
              </div>
            ) : null}

            <div className="flex items-end gap-3">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="prompt"
                  className="block text-xs font-medium text-[#1F2937]/70"
                >
                  Message
                </label>
                <input
                  id="prompt"
                  name="prompt"
                  type="text"
                  value={input}
                  onChange={(e) => {
                    if (status === 'error') clearError()
                    setInput(e.target.value)
                  }}
                  placeholder="Type a message…"
                  className="mt-1 w-full rounded-md border border-[#1F2937]/15 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-offset-2 focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/25"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#10B981] px-4 text-sm font-semibold text-white shadow-sm outline-none ring-offset-2 hover:bg-[#10B981]/90 focus:ring-2 focus:ring-[#10B981]/35 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#1F2937]/60">
              <span>
                {isLoading ? 'Generating response…' : 'Press Enter to send'}
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${isLoading ? 'bg-[#10B981]' : 'bg-[#3B82F6]'}`}
                />
                {isLoading ? 'Working' : 'Ready'}
              </span>
            </div>
          </section>
        </form>
      </div>
    </main>
  )
}
