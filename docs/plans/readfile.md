# Build plan: `readFile` tool for the chatbot

## Pass 1 — UI / Layout

**Context**

- The feature lives inside the existing conversational chat: the user continues to type requests and read assistant replies in the same thread. There is no dedicated file-browser or file-picker surface in v1.

**Scope**

- **Included:** Structure and placement of anything the user sees that is specific to file-read assistance (e.g. how assistant turns that reference file content in the message flow), and any minimal chrome needed so the chat remains understandable when a read was used—without binding to real file content yet.
- **Not included:** Real file contents, tool results, loading tied to real I/O, error text from the filesystem, or logic that decides when a read occurred.

**Layout**

- Preserve a single conversational column: user messages and assistant messages in order.
- If the product already distinguishes “tool” or “system” affordances in the thread, reserve space or hierarchy for that in line with existing chat patterns; if not, avoid inventing a heavy new pattern—assistant wording can carry the narrative.
- No new routes or modals for choosing files; paths come only from natural language and model-supplied tool arguments.

**Reuse**

- Existing chat message components, typography, spacing, and message ordering conventions.

**Constraints**

- No real data
- No derived logic
- No new abstractions unless required for layout

**Implementation order**

1. Confirm where assistant replies (and any optional tool/status affordance) render relative to the current chat layout.
2. Adjust or extend message presentation structure only as needed so file-backed answers remain readable in the same thread.
3. Validate that no new screens or pickers are required for v1.

**Verification**

- Layout matches intended structure
- Components are clean and reusable
- No unnecessary complexity

---

## Pass 2 — Data Wiring

**Context**

- The assistant may call a `readFile` tool with `{ path: string }`. The system must perform a read at that path, return file contents as text to the model layer, or return a clear failure when the file is missing or unreadable. The model remains the caller; the user does not drive the tool through a separate UI control beyond chat.

**Scope**

- **Included:** Registering or exposing the `readFile` tool with the agreed name and input shape; executing a single-file, read-only read; passing text results and simple error outcomes into the same conversational pipeline used for other assistant steps; basic presentation of “we are waiting on a read” if the stack already supports tool-step loading.
- **Not included:** Deriving user-facing copy from errors, summarisation, truncation policy beyond raw read, sorting or filtering of multiple files, directory listing, writes, or streaming/chunking for very large files.

**Data**

- **Source of truth:** The file at the resolved path on the local filesystem for the environment where the chatbot runs; the path argument supplied by the model when it invokes the tool.
- **Flow:** Tool invocation carries `path` → read operation → text payload or error object → fed back into the assistant turn so the model can continue the reply.

**Behaviour**

- While a read is in flight, show loading consistent with how other long-running or tool steps are shown (or add the lightest equivalent if none exists).
- On success, the raw text from the read is available to the assistant for inclusion in the visible reply; basic rendering means the assistant’s message can show content that depends on that text without additional computation in this pass.
- On failure, surface a structured or primitive error outcome to the model layer first; user-visible phrasing can remain generic until Pass 3 if needed.

**Reuse**

- Existing tool-registration and chat completion flow, and any shared helpers for invoking tools from the model runtime.

**Constraints**

- Do **not** add derived or computed logic
- Do **not** duplicate backend logic
- Do **not** refactor unrelated structures
- Do **not** introduce sorting or filtering beyond direct display of returned data

**Edge cases**

- Missing file
- Unreadable file (permissions, I/O error)
- Empty file (zero-length text)
- Undefined or null path from the model (treat as invalid input to the read path)

**Implementation order**

1. Connect `readFile` end-to-end from model tool call to filesystem read and back into the assistant pipeline.
2. Ensure success returns text only; defer binary handling per scope (no binary support in v1).
3. Wire loading and empty/minimal error channels so the UI and model always get a defined outcome from the tool.

**Verification**

- Correct data appears in UI
- No placeholder values remain
- Safe handling of loading and empty states

---

## Pass 3 — Derived Logic

**Context**

- Raw read results and low-level errors need to be turned into predictable, user-meaningful outcomes: clear distinction between “not found,” “cannot read,” and success, without building heavy recovery flows. Optional: minimal guardrails so obviously non-text or unusable reads do not pollute the conversation—without adding new data sources or refetching.

**Scope**

- Map filesystem and tool errors to a small, fixed set of user-facing meanings.
- Apply any minimal rules needed so the assistant’s use of file text stays coherent (e.g. consistent handling of empty reads, or skipping expansion when the tool reported an error)—without introducing directory listing, writes, or large-file streaming.

**Data**

- Text returned from successful reads in Pass 2.
- Error signals from failed reads (not found, unreadable, invalid path).

**Logic**

- Normalize errors into stable categories the assistant (or message layer) can rely on.
- Decide how each category affects what the user sees (short error message vs. silent handoff to model wording—pick one consistent approach).
- If the product requires a minimal check that content is safe to treat as text for display, apply a single, local rule (without new network or datastore access).

**Behaviour**

- Assistant replies reflect success (content available for analysis) vs. failure (explicit, simple explanation) in a consistent way.
- No new features beyond clearer outcomes for the same read-only tool.

**Constraints**

- Do **not** refetch or restructure data
- Do **not** introduce unnecessary abstraction
- Keep logic readable and local where possible
- Do **not** introduce new data sources

**Edge cases**

- Empty file: still success with empty string; assistant should not claim missing file.
- Boundary: path valid but file not text-friendly—align with v1 “text only” scope without adding binary support.
- Concurrent or repeated reads: each call independent; no cross-request state required.

**Implementation order**

1. Define the small error taxonomy and user-visible messages for each.
2. Apply mapping at the boundary where tool results become assistant-visible state.
3. Sanity-check success vs. failure paths so the model never receives ambiguous combinations.

**Verification**

- Logic produces correct outputs
- Results match expectations
- No duplication of logic

---

## Pass 4 — Final Polish

**Context**

- The feature is read-only and conversational; v1 intentionally skips sandboxing, ACLs, and large-file streaming. Final work tightens cohesion, copy, and trust framing at a minimal level appropriate for a first release.

**Scope**

- Copy and tone for errors and any short system hints.
- Visual consistency with the rest of the chat (spacing, emphasis when quoting file excerpts).
- Remove dead code or duplication introduced only for this feature.
- Brief, honest product framing of the new trust boundary (model-initiated filesystem read) where the user is likely to see it—without scope creep into security product features.

**Behaviour**

- Interactions feel the same as the rest of the app; file-assisted answers read naturally in the thread.
- Confirm end-to-end: explicit user ask → optional tool call → text or clear error → assistant answer.

**Reuse**

- Existing chat patterns for code blocks, quotes, or monospace if file snippets are shown.

**Constraints**

- Do **not** introduce new features
- Do **not** significantly restructure
- Only refine and simplify
- Do **not** introduce new design decisions beyond what the brief allows

**Edge cases**

- Minor inconsistencies between loading, success, and error states
- Wording that overpromises safety or omits that reads are local and model-driven

**Verification**

- Feature feels cohesive
- Code is clean and readable
- Matches app patterns
- Works end-to-end

---

## Assumptions

- The runtime environment where the chatbot executes has a defined working directory or path resolution rules; resolving relative vs. absolute paths follows existing project convention without inventing a new policy in this plan.
- Tool visibility to the model (when `readFile` is in the tool list) is configured in the same layer as other tools; this plan does not prescribe provider-specific APIs.