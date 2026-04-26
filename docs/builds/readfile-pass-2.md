# readFile — Pass 2 (data wiring)

**Pass complete:** 2 — Data wiring

**Implemented**

- Registered `readFile` on the chat route with input `{ path: string }` (jsonSchema, `additionalProperties: false`); `execute` resolves paths with `path.resolve(process.cwd(), …)`, reads UTF-8 text via `fs/promises`, returns raw string on success (including empty file), and returns plain `readFile: …` error strings for missing/invalid path, not found, non-file path, permission, and other I/O failures.
- Left existing `streamText` + `stopWhen: stepCountIs(5)` so the run can continue after tool execution.
- Wired `FileReadContextSlot` to UI message parts: when any `tool-readFile` part is not yet in a terminal state, the slot shows “Reading file…” (`aria-live="polite"`); otherwise it stays a hidden `data-slot` hook. The thread still uses the same “Thinking…” row while the turn is `submitted` / `streaming`.

**Files changed**

- `app/api/chat/route.ts`
- `app/page.tsx`

**Human review**

- From the project root, ask the model to read a real file (e.g. `README.md` or `package.json`) and confirm the reply reflects contents; try a bad path and confirm the tool result is an error string the model can use.
- While the tool is executing, the assistant bubble should show “Reading file…” above the text when the UI exposes an in-progress `tool-readFile` part.
- Empty file: tool should return an empty string, not an error.

**Notes**

- User-facing error copy is not normalized (Pass 3). Binary / large files are not specially handled beyond UTF-8 read (per plan).
- `next build` may log a Turbopack NFT warning tracing `fs`/`path` in the API route; build still completes.

**Blockers**

- None

**Next**

- Pass 3 — derived logic: stable error categories and consistent user/assistant presentation.