export default function Chat() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#1F2937]">
      <div className="mx-auto flex h-screen max-w-3xl flex-col px-4 py-6">
        <header className="flex items-start justify-between gap-4 pb-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">ACE Chatbot</h1>
            <p className="mt-1 text-sm text-[#1F2937]/70">
              A simple chat UI layout (Pass 1).
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
              defaultValue="gemini-2.5-flash"
              className="mt-1 w-full rounded-md border border-[#1F2937]/15 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-offset-2 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/25"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gpt-4.1">GPT-4.1 (placeholder)</option>
              <option value="claude-4">Claude 4 (placeholder)</option>
            </select>
          </div>
        </header>

        <section
          aria-label="Messages"
          className="flex-1 overflow-hidden rounded-xl border border-[#1F2937]/10 bg-white shadow-sm"
        >
          <div className="h-full overflow-y-auto px-4 py-5">
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#3B82F6] px-4 py-3 text-sm text-white shadow-sm">
                  Hey! Can you help me build a multi-provider chatbot UI?
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#1F2937]/5 px-4 py-3 text-sm text-[#1F2937] shadow-sm">
                  Absolutely. Start with a clean layout: a message list, an
                  input bar, and a model selector. We’ll wire data in the next
                  pass.
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#3B82F6] px-4 py-3 text-sm text-white shadow-sm">
                  Great—let’s keep it simple and readable.
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-[#1F2937]/5 px-4 py-3 text-sm text-[#1F2937] shadow-sm">
                  Done. This page is currently static placeholders only.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Composer"
          className="mt-4 rounded-xl border border-[#1F2937]/10 bg-white p-3 shadow-sm"
        >
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
                placeholder="Type a message…"
                className="mt-1 w-full rounded-md border border-[#1F2937]/15 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-offset-2 focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/25"
              />
            </div>

            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#10B981] px-4 text-sm font-semibold text-white shadow-sm outline-none ring-offset-2 hover:bg-[#10B981]/90 focus:ring-2 focus:ring-[#10B981]/35"
            >
              Send
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#1F2937]/60">
            <span>Tip: Shift+Enter for new lines (future)</span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
              Layout only
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
