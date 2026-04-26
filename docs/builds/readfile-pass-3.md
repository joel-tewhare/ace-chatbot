# readFile — Pass 3 (derived logic)

**Pass complete:** 3 — Derived logic

**Implemented**

- Defined six stable error codes (`invalid_input`, `access_denied`, `not_found`, `not_readable`, `permission_denied`, `read_error`) with one fixed user-facing `message` each via `READ_FILE_USER_MESSAGES`.
- Tool results are unambiguous: success `{ ok: true, content: string }` (empty string allowed) vs failure `{ ok: false, code, message }`. Updated the tool description so the model treats empty `content` as success and uses `message` on failure without implying a read succeeded.
- Mapped prior filesystem/policy outcomes into the taxonomy; generic I/O failures use `read_error` without leaking raw system strings to the user.
- After a successful UTF-8 read, content containing a null byte is classified as `not_readable` (v1 text-only guardrail).

**Files changed**

- `app/api/chat/route.ts`

**Human review**

- Ask the model to read a real file: tool result should be `{ ok: true, content: "…" }` and the reply should use the file, not report an error.
- Empty file: `{ ok: true, content: "" }`; assistant should not claim “file not found.”
- Bad path, missing file, directory path, blocked path (e.g. under `node_modules`), and permission errors: `{ ok: false, … }` with the expected `code` and stable `message`.
- Optional: file with embedded `\0` should yield `not_readable`.

**Notes**

- Pass 4 may refine copy/tone; no UI changes in this pass (assistant still renders tool outcome via model text).
- Tool output shape changed from plain strings to structured objects for the model layer only.

**Blockers**

- None

**Next**

- Pass 4 — polish: copy, visual consistency, trust framing, dead-code cleanup if any.

