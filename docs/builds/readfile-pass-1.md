# readFile — Pass 1 (UI / layout)

**Pass complete:** 1 — Shell / structure

**Implemented**

- Kept a single conversational column: user/assistant order and scroll region unchanged.
- Added `FileReadContextSlot` for assistant messages only: hidden `data-slot="file-read-context"` above the markdown body—structural hook for file-read path/status in Pass 2+ (no real tool data, I/O, routes, or pickers).
- Introduced `getMessageMarkdownComponents` and layout for file-like replies: `pre` + fenced (language-class) `code` vs inline `code`, with scrollable bordered blocks for quoted file snippets.

**Files changed**

- `app/page.tsx`

**Human review**

- Message bubbles and “Thinking…” row behave as before; try a reply with a fenced code block to confirm block vs inline code.
- In DevTools, assistant bubbles should include the hidden `data-slot` node above prose (invisible until later passes wire it).
- No new screens or file choosers.

**Notes**

- The app had no prior tool row in the thread; the slot stays minimal so the assistant message still carries the narrative.
- `readFile` tool and filesystem wiring are out of scope for this pass (Pass 2).

**Blockers**

- None

**Next**

- Pass 2 — data wiring: register `readFile`, read pipeline, and align loading/error channels with the plan.

### Review notes

- Code block vs inline rendering confirmed working via markdown helper logic
- FileReadContextSlot is a structural placeholder for future tool UI, not a tool itself
- Assistant messages require a flexible container to support multi-part content (slot + text)