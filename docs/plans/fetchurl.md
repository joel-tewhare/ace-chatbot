# Build plan: `fetchUrl` (chat URL fetch)

## Pass 1 — UI / Layout

**Context**

- The feature lives in the existing single-thread chat: the user types requests and reads assistant replies in the same place as today. There is no new screen, route, or mode for this release.

**Scope**

- **Included:** How the thread continues to look and read when a URL-based answer is possible—same message list, same input, same assistant message area—plus any existing affordance for in-flight tool work (e.g. status or step indication) that already applies to other tools.
- **Not included:** Real fetched text, real errors from the network, a dedicated “URL fetch” panel or tool card, or logic that branch-tests success versus failure of a fetch.

**Layout**

- Preserve one conversational column: user messages and assistant messages in order.
- Do not add layout for pasting a URL, previewing a page, or showing raw HTML; the user states the URL in natural language, and the assistant responds in normal prose.
- If the app already surfaces tool activity in a lightweight way, keep fetch aligned with the same hierarchy and density as the other two chat tools; if not, do not introduce a new visual system for this tool alone.

**Reuse**

- Existing chat shell, message components, and any shared pattern for tool-in-progress or multi-step turns.

**Constraints**

- No real data
- No derived logic
- No new abstractions unless required for layout

**Implementation order**

1. Confirm the chat remains the only surface: no new navigation or modals for URL entry or results.
2. Align any optional in-thread indicators with how existing tools are represented, without special-casing fetch in the layout.
3. Stop when the experience is indistinguishable from the current chat at the structure level, aside from what existing tool patterns already do.

**Verification**

- Layout matches intended structure
- Components are clean and reusable
- No unnecessary complexity

---

## Pass 2 — Data Wiring

**Context**

- The assistant must be able to invoke a `fetchUrl`-style tool with a URL argument. The system performs a server-side request to a public URL, then passes either retrieved body-related content or a failure outcome back into the same multi-step tool flow used by the other chat tools, within the same step budget and orchestration as today.

**Scope**

- **Included:** Registering the new tool with the agreed name and input shape; routing invocations to a server handler that can perform an HTTP fetch and return a result object the model can consume; wiring success and error outcomes into the assistant turn without changing unrelated tools beyond minimal consistency; loading or step behaviour that matches other tools.
- **Not included:** Strict URL validation rules, HTML-to-text extraction policy, a 5,000-character cap, tailored user-facing error copy for each failure class, re-fetching, crawling, or restructuring how other tools work.

**Data**

- **Source of truth:** The public HTTP response for the URL provided by the model when it invokes the tool, fetched in the server environment that already hosts the chat backend.
- **Flow:** Tool invocation carries the URL string → server fetch → payload that represents what was retrieved (or a simple failure) → returned through the same tool-result path as existing tools so the model can continue the reply in the same thread.

**Behaviour**

- While a fetch is in progress, use the same loading or step-in-progress treatment as for other long-running or tool steps (or the lightest equivalent the stack already provides).
- On success, make retrieved content available to the model as the tool outcome so the assistant can draft a normal chat message; avoid inventing new UI to display raw text outside the assistant reply.
- On failure, propagate a clear failure path to the model layer first; phrasing in the user-visible message can follow existing patterns and need not be fully differentiated until Pass 3 if the pipeline allows.

**Reuse**

- Existing tool registration, multi-step tool execution, and chat completion wiring at a conceptual level.

**Constraints**

- Do **not** add derived or computed logic
- Do **not** duplicate backend logic
- Do **not** refactor unrelated structures
- Do **not** introduce sorting or filtering beyond direct display of returned data

**Edge cases**

- Tool invoked without a usable URL value (treat as data presence, not yet full validation copy)
- Empty response body
- Tool timeout or step budget exhausted in the same way as for other tools

**Implementation order**

1. Expose the tool in the same registry or schema layer as the other two chat tools and thread its arguments into the server.
2. Implement a single-request fetch on the server and return a result the orchestration layer already understands.
3. Confirm end-to-end that a happy-path fetch reaches the model and a failed request still completes the turn without breaking the chat path.

**Verification**

- Correct data appears in UI
- No placeholder values remain
- Safe handling of loading and empty states

---

## Pass 3 — Derived Logic

**Context**

- Public pages vary in size and format; the product requires plain text, a maximum length, safe handling of bad input, and clear user-facing errors for network and HTTP issues. The model must not be led to treat invented content as if it were fetched.

**Scope**

- **Included:** Validating that a URL is present and acceptable for this feature (e.g. missing or clearly invalid input); optional scheme or safety rules that match the stated scope (public, non-authenticated fetch only); reducing HTML (or other response bodies) to simple plain text; truncating to the first 5,000 characters of that text for the tool result; mapping HTTP and network errors to short, safe error strings; aligning step limits and tool behaviour with the existing multi-tool setup.
- **Not included:** Crawling additional links, new data sources, refetching for summarisation, or changing the high-level data wiring from Pass 2.

**Data**

- Raw response material and metadata produced by the Pass 2 fetch path, plus the URL string from the tool arguments.

**Logic**

- Decide whether the argument is a valid, supported URL for a single public GET (or the project’s chosen verb); reject or short-circuit with a clear error when it is not.
- Extract human-readable text from the response in a simple, maintainable way without heavy HTML parsing beyond what is trivial in context.
- Truncate the extracted string to 5,000 characters before returning it as the tool’s successful payload.
- Map common failure cases (e.g. DNS, timeout, non-success status) to consistent, user-safe messages returned as the tool outcome when appropriate.

**Behaviour**

- The assistant’s visible reply continues to be normal chat prose, now grounded in real truncated page text or a clear “could not load” class of message instead of silent failure.
- In-thread presentation stays as in Pass 1; changes here are in what the model receives and how errors read, not in new chrome.

**Constraints**

- Do **not** refetch or restructure data from the wire beyond what is needed for validation, extraction, truncation, and error mapping
- Do **not** introduce unnecessary abstraction
- Keep logic readable and local where possible
- Do **not** introduce new data sources

**Edge cases**

- Very large pages (truncation only)
- Responses that are not HTML or that extract to empty text
- Redirects, 4xx/5xx, and timeouts
- Borderline or malformed URL strings

**Implementation order**

1. Enforce “URL required” and public-only / supported-URL rules, returning safe error text when checks fail.
2. Implement text extraction and the 5,000-character cap on the success path.
3. Unify network and HTTP failure handling with short, user-facing error strings and confirm parity with other tools’ step limits and orchestration.

**Verification**

- Logic produces correct outputs
- Results match expectations
- No duplication of logic

---

## Pass 4 — Final Polish

**Context**

- The feature should feel like a natural third tool beside file read and calculate-style tools: predictable, bounded, and easy to reason about in chat, with no new user-facing features beyond refinement.

**Scope**

- **Included:** Consistency of naming and behaviour with the other chat tools; copy polish for error messages; small cleanups in the tool handler and tests; a minimal automated check that a good URL returns usable text and a bad or failing case returns a safe error without breaking the run; a short manual checklist for verification in the real app.
- **Not included:** New UI, crawling, auth, or scope expansion beyond the preplan.

**Behaviour**

- Final interaction: user asks with a URL, assistant may use the tool, user sees a concise summary or answer grounded in fetched text, or a clear error—same as the intended flow, with no regressions to the rest of the chat.

**Reuse**

- Align error tone, tool metadata, and testing style with the rest of the project’s assistant tooling.

**Constraints**

- Do **not** introduce new features
- Do **not** significantly restructure
- Only refine and simplify

**Edge cases**

- Inconsistent error wording left over from Pass 3
- Minor rough edges in how failures read next to the other tools

**Verification**

- Feature feels cohesive
- Code is clean and readable
- Matches app patterns
- Works end-to-end
