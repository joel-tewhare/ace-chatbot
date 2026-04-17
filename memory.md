# memory.md

Practical notes I want to remember and reuse.

## API boundaries

- Validate request shape at public boundaries (e.g. `req.json()` + payload types). Prefer a deterministic `400` for malformed payloads over accidental `500`s from downstream helpers (`convertToModelMessages`, provider calls).

## UX + failure modes

- Don’t clear user input optimistically unless you also handle failure. If a send fails, either clear only after success, or restore the previous text and show an actionable error (missing API key, network error, etc.).

## Project deliverables

- Keep README “steps” aligned with repo artifacts. If the README requires a file (e.g. `evals.mjs`), ensure it exists or explicitly mark it as out-of-scope so the deliverable isn’t ambiguous.

## Message Structure vs UI Display

AI SDK messages are structured as parts (not plain text).
UI should derive display-friendly text (e.g. via helper) rather than using raw message shape directly.

Pattern: raw data → transform → UI-ready data

## SDK Layered Abstraction (AI Chat)

Chat flow is split across layers:

- UI (useChat) handles state + sending
- API route handles validation + provider selection
- SDK handles model execution

Each layer has a clear responsibility.

## UI Feedback Pattern — System Status

Show lightweight system status near the interaction point (e.g. “Ready” / “Working”).

Improves clarity without interrupting flow.

## Async Error Handling (SDK Hooks)

- Not all async helpers throw on failure.
- Some return errors via state instead of rejecting promises.
- Always verify whether `try/catch` is actually triggered before relying on it for UI error handling.

## Async UI + User Input

When handling async actions (e.g. sending messages), account for user interaction during the request.

Avoid overwriting user input if the user continues typing while a request is in-flight.
