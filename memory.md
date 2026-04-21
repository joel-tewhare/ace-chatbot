# memory.md

Practical notes I want to remember and reuse.

## API boundaries

- Validate request shape at public boundaries (e.g. `req.json()` + payload types). Prefer a deterministic `400` for malformed payloads over accidental `500`s from downstream helpers (`convertToModelMessages`, provider calls).
- Use HTTP status codes that reflect the failure class. Missing credentials/config is an operational problem (often `500`/`503`), not “route not implemented” (`501`), which can mislead debugging and clients.

## UX + failure modes

- Don’t clear user input optimistically unless you also handle failure. If a send fails, either clear only after success, or restore the previous text and show an actionable error (missing API key, network error, etc.).

## Project deliverables

- Keep README “steps” aligned with repo artifacts. If the README requires a file (e.g. `evals.mjs`), ensure it exists or explicitly mark it as out-of-scope so the deliverable isn’t ambiguous.
- Evals should test the actual contract: if the prompt requires a JSON object schema, validate required fields/shapes (not just “parsable JSON”), and prefer heuristics that reduce false positives so comparisons aren’t noisy.

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

## Security / Backend Notes

### Bearer Token Parsing vs Authorization

- Parsing a bearer token and authorizing a request are separate concerns.
- `getBearerToken()` only extracts the token from the `Authorization` header.
- `isAuthorizedChatRequest()` performs the actual access check.
- Good separation:
  - parse input first
  - validate/authorize second
  - only then continue request handling

---

### Service Config Check vs Request Auth Check

- Two different questions:
  - **Is the service configured correctly?**
  - **Is this specific request allowed?**
- Example:
  - missing `CHAT_API_SECRET` → `503 Service unavailable`
  - invalid or missing bearer token → `401 Unauthorized`
- This keeps configuration problems separate from access problems.

---

### Timing-Safe Secret Comparison

- Comparing secrets with normal string equality can leak timing information because comparison often stops at the first mismatch.
- `timingSafeEqual` avoids this by comparing all bytes consistently.
- It works on `Buffer` values, so strings are converted first with `Buffer.from(...)`.
- Pattern:
  - convert both values to buffers
  - check lengths first
  - compare with `timingSafeEqual`

---

### What a Buffer Is

- A `Buffer` is a byte-level representation of data.
- In security code, buffers are useful because some lower-level comparison utilities work on raw bytes rather than JavaScript strings.
- In this case, strings are converted to buffers so they can be compared safely with `timingSafeEqual`.

---

### Client-Controlled System Messages Are a Prompt Injection Risk

- `system` messages control assistant behaviour, so they should not be trusted from the client.
- A safe pattern is to strip client-sent `system` messages before sending content to the model.
- This keeps behaviour controlled by the server rather than the user.
- Server-owned system prompts are safer than client-owned system prompts.

---

### Sanitize Before Execution

- Before calling the model:
  - validate payload shape
  - remove untrusted message types
  - reject empty/invalid message arrays
- This is the LLM equivalent of validating request bodies before hitting business logic.

---

### Dev Gate vs Real Auth

- A shared client/server bearer token can act as a lightweight dev gate.
- If the token is stored in a `NEXT_PUBLIC_...` variable, it is visible to the browser and is not a true secret.
- This pattern is useful for learning request validation flow, but it is not production authentication.
- In production, this should be replaced by real auth such as sessions or JWT-based identity checks.

### Submit Handlers Can Carry Both UX Guards and Request Auth

- A frontend submit handler can do more than send data:
  - prevent default form submission
  - trim and validate input
  - block duplicate sends while loading
  - clear stale UI errors
  - attach request metadata such as model selection or auth headers
- This keeps request preparation close to the user action that triggers it.