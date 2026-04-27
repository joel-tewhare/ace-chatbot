Practical notes I want to remember and reuse.

## API boundaries

- Validate request shape at public boundaries (e.g. `req.json()` + payload types). Prefer a deterministic `400` for malformed payloads over accidental `500`s from downstream helpers (`convertToModelMessages`, provider calls).
- Use HTTP status codes that reflect the failure class. Missing credentials/config is an operational problem (often `500`/`503`), not “route not implemented” (`501`), which can mislead debugging and clients.

## UX + failure modes

- Don’t clear user input optimistically unless you also handle failure. If a send fails, either clear only after success, or restore the previous text and show an actionable error (missing API key, network error, etc.).

## Project deliverables

- Keep README “steps” aligned with repo artifacts. If the README requires a file (e.g. `evals.mjs`), ensure it exists or explicitly mark it as out-of-scope so the deliverable isn’t ambiguous.
- Evals should test the actual contract: if the prompt requires a JSON object schema, validate required fields/shapes (not just “parsable JSON”), and prefer heuristics that reduce false positives so comparisons aren’t noisy.
- Eval scripts should fail the run when checks fail, not only print failed booleans. Track aggregate failure state across cases and set a non-zero exit code so regressions are visible in automation.
- If an eval mirrors app tool logic instead of importing it, mark the duplication explicitly and keep the contract in sync with the route. When you fix policy or trust-boundary logic, update evals in the same change and add a case that would have failed before (if feasible), so the mirror does not keep hiding the same class of gap. Prefer shared logic once the tutorial constraint is gone.
- Keep JSON evals strict when the prompt contract says JSON-only. Markdown fences should fail strict parsing; use structured outputs later if the product needs stronger JSON adherence.

## Message Structure vs UI Display

AI SDK messages are structured as parts (not plain text).
UI should derive display-friendly text (e.g. via helper) rather than using raw message shape directly.
Tool parts can be displayable state even before text exists, so pending tool UI should not be gated only on rendered message text.

Pattern: raw data → transform → UI-ready data

---

### Rendering vs Formatting (AI responses)

- If AI output includes structure (lists, emphasis, sections), formatting the string alone is not sufficient.
- Fix the rendering layer first before attempting string-level formatting.
- Ensure the UI has a **rendering layer** (e.g. markdown renderer).
- Pattern:
  - raw text → renderer (e.g. markdown) → styled UI
- Formatting problems are often **rendering problems in disguise**.

---

### Markdown Rendering Pattern (Chat UI)

- Use a markdown renderer (e.g. `react-markdown`) for AI responses instead of displaying raw text.
- This enables:
  - bold/emphasis
  - lists
  - structured sections
- Keep rendering logic separate from message data.

---

### Typography in Chat vs Document UI

- Tailwind Typography (`prose`) is designed for documents, not chat.
- In chat UIs:
  - reduce vertical spacing
  - keep lists compact
  - prevent large heading sizes
- Pattern:
  - apply `prose`
  - then **compress spacing for chat context**
- `prose` should act as the baseline typography system.
- Component-level styling should be used for targeted overrides.
- Prefer a single “owner” of vertical rhythm to avoid overlapping spacing rules.

---

## SDK Layered Abstraction (AI Chat)

Chat flow is split across layers:

- UI (useChat) handles state + sending
- API route handles validation + provider selection
- SDK handles model execution

Each layer has a clear responsibility.

---

## Tool calling workflow notes

- Treat tool calling as a loop: user → model decides → tool executes code → tool result returns to model → model writes final chat response.
- A tool has two important layers:
  - the model-facing contract: `description` + `inputSchema`
  - the server execution boundary: `execute`
- Keep pass isolation clear:
  - Pass 1 defines a complete tool, including `description`, `inputSchema`, and `execute`.
  - Pass 2 wires the completed tool into `streamText`.
  - Avoid mixing unfinished tool logic with live model-loop wiring.
- The first tool should be implemented end-to-end before adding more tools, to prove the tool-calling loop works.
- After the pattern is proven, later tools can reuse the structure with lighter planning.
- Cross-reference: see Workflow insights — tool calls require step control to complete the response loop.

---

## Calculator tool notes

- The calculator tool uses `{ expression: string }` rather than a bare string so the tool input shape stays explicit and extensible.
- The model is responsible for translating natural-language math, such as “15% of 320”, into a valid expression like `0.15 * 320`.
- The helper evaluator turns the expression string into executable JavaScript and returns the raw result.
- The tool `execute` function validates and formats the helper result before returning it to the model.
- Direct evaluation with `Function` or `eval` is tutorial-only and unsafe for production because it can execute arbitrary JavaScript.
- In production, replace direct evaluation with a dedicated math parser, sandbox, or constrained evaluator.

---

## Workflow calibration notes

- Calculator is low-risk enough for normal local development, but still useful as a workflow rehearsal.
- File-reading and URL-fetching tools are higher-risk because they expand the tool attack surface to filesystem and network access. Read-side path and symlink policy is defined in one place: **Filesystem Tool Boundaries** below.
- Use sandboxing or least-privilege mode once tools can read files or fetch URLs.
- Mock mode should preserve the same input/output shape as real execution, even if the implementation is stubbed.
- Mock results should be realistic in shape and error behaviour so integration does not drift too far from real execution.

---

## Tool calling — wiring and control

- Tool calling requires both:
  - `tools: {}` to expose capabilities to the model
  - step control (`stopWhen: stepCountIs(n)`) to allow the model to continue after tool execution
- Without step control, the model may call a tool but never produce a final text response.
- A typical tool loop is:
  - model decides → tool executes → result returned → model produces final answer
- Step limits act as both:
  - execution control (prevent infinite loops)
  - safety boundary (limit model/tool chaining)

---

## Tool execution contract

- Tool `execute` functions must:
  - never throw errors
  - always return a predictable output (string in this implementation)
- Establish a clear contract:
  - success → plain numeric string (e.g. "248186")
  - failure → consistent prefix (e.g. "Could not evaluate: <reason>")
- Consistent output shape improves model behaviour and reduces hallucination or retry loops.

---

## Error handling patterns

- Separate evaluation stages:
  - compile (syntax errors)
  - run (runtime errors like ReferenceError, RangeError)
- Map low-level JS errors into user-meaningful messages:
  - SyntaxError → invalid expression
  - ReferenceError → undefined name / invalid variable
  - RangeError → overflow / out-of-range
- Handle non-finite numbers (NaN, Infinity) explicitly at the tool boundary.
- Validate inputs before execution (type + presence), not just outputs after execution.

---

## Model ↔ tool responsibility split

- Model is responsible for:
  - deciding when to call the tool
  - translating natural language into a valid expression
  - presenting the final response to the user
- Tool is responsible for:
  - executing deterministic logic
  - validating input/output
  - returning safe, structured results
- Tool results are signals; the model controls final wording.

---

## Description and routing

- Tool `description` is critical for correct tool selection.
- Good descriptions:
  - clearly define when to use the tool
  - clearly define when NOT to use the tool
  - include transformation expectations (e.g. rewrite percentages to decimals)
- Better descriptions lead to fewer incorrect tool calls and more reliable multi-tool behaviour.

---

## Tool registry pattern

- Maintain a central `chatTools` object:
  - maps tool names → implementations
  - passed into `streamText`
- Use `as const` to:
  - lock tool names to literal types
  - improve type safety and consistency as tools scale
- Treat this as infrastructure, not feature-specific code.

---

## Workflow insights

- Pass isolation is important:
  - Pass 2 = wiring only
  - Pass 3 = behaviour refinement (no new capability)
  - Pass 4 = polish only
- Do not mix:
  - tool definition
  - wiring
  - behaviour tuning
- First tool should be built end-to-end to validate the loop, then reused as a pattern for additional tools.

---

## System design insight

- Tool calling shifts work from:
  - probabilistic model reasoning
  → deterministic code execution
- This improves:
  - correctness (math, file access, etc.)
  - efficiency (fewer tokens, faster execution)
- Tools act as controlled boundaries where untrusted model input meets trusted system logic.

---

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

---

## Agent Execution Patterns

### Scope before execution

- Before making changes, identify:
  - which files are relevant
  - why those files are sufficient
- Prefer narrow, explicit scope over broad repo scanning.

---

### Avoid agent substitution

- If a requested solution cannot be implemented (e.g. missing dependency), the correct behaviour is to **stop and report**, not substitute with an alternative approach.
- “Close enough” solutions reduce predictability and control.

---

### Minimal change principle

- Prefer small, targeted changes over rewrites.
- Preserve:
  - component structure
  - data flow
  - existing contracts

---

## Security / Backend Notes

### Filesystem Tool Boundaries

- For file-reading tools, apply access policy to the canonical filesystem target, not only the lexical user path.
- `readFile` follows symlinks, so path checks based only on `path.resolve()` can drift from the bytes actually read.
- Use `realpath` when symlinks are allowed, or `lstat` + reject symlinks when they are out of scope.

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
- Prefer validating payload shape before execution rather than relying on downstream errors.
- Explicit validation improves debuggability and makes behaviour clearer (e.g. which message types are supported or ignored).

---

### Dev Gate vs Real Auth

- A shared client/server bearer token can act as a lightweight dev gate.
- If the token is stored in a `NEXT_PUBLIC_...` variable, it is visible to the browser and is not a true secret.
- This pattern is useful for learning request validation flow, but it is not production authentication.
- In production, this should be replaced by real auth such as sessions or JWT-based identity checks.

---

### Submit Handlers Can Carry Both UX Guards and Request Auth

- A frontend submit handler can do more than send data:
  - prevent default form submission
  - trim and validate input
  - block duplicate sends while loading
  - clear stale UI errors
  - attach request metadata such as model selection or auth headers
- This keeps request preparation close to the user action that triggers it.

---

## Type Safety (Scaling)

- Avoid `any` for structured data such as message parts.
- Use narrow types or discriminated unions as features expand (e.g. text vs image parts).
- Strong typing prevents silent breakage as data shapes evolve.

---

## Config Consistency

- Avoid duplicating configuration (e.g. model IDs in UI and API).
- Prefer a single shared source of truth to prevent drift and mismatched behaviour.
- Baseline or PR review should explicitly name duplicated allowlists, similar to naming missing shared types.

---

## Review Triage

- Classify review findings:
  - Accept (act now)
  - Accept (note for later)
  - Partially accept
- For small projects, prioritise:
  - correctness issues
  - clear maintenance risks
- Capture the rest as memory instead of over-optimising code.

---

## Permission / Capability Thinking

### Least privilege (practical)

- Start with minimal capability, then expand only as required.
- Do not remove capabilities blindly — ensure the task still has a valid execution path.

---

### Permissions are environment-dependent

- Capability paths differ by tool:
  - in some environments, file access may depend on shell access
- Removing one capability (e.g. shell) can unintentionally remove another (e.g. file reading).

---

### Restrict the task if you can’t restrict the tool

- In coarse-grained environments:
  - simulate least privilege via constraints
  - explicitly forbid:
    - network access
    - installs
    - unrelated commands
- Control is enforced through instruction discipline, not tooling.

---

### Match permissions to task risk

- Low-risk tasks (UI, formatting, local logic):
  - minimal concern for strict permission control
- Higher-risk tasks (APIs, auth, external integrations):
  - apply strict least-privilege thinking
  - prefer restricted environments where possible

---

## Build-pro, checks, and evals — post-implementation notes

Context: insights captured after a `/build-pro` run plus checks and eval work on bounded tool features.

### Tool system: shared implementation pattern

- Keep tool logic in a single shared module (e.g. `lib/fetchurl.mjs`) and reuse it across API routes and evals. This keeps runtime behaviour and test coverage aligned and avoids divergence between environments.

### Tool design: bounded execution over open access

- External tools should be tightly constrained: protocol checks, localhost blocking, size limits, timeouts, output caps. Treat tools as controlled capabilities, not open-ended access to external systems.

### Tool contract: structured success/failure shape

- Return consistent, predictable objects from tools:
  - success → `{ ok: true, text }`
  - failure → `{ ok: false, code, message }`
- The model can then explain failures without inventing content; reliability improves. (Cross-reference: **Tool execution contract** for earlier calculator-style string contracts; the `{ ok, … }` shape is the structured variant for richer tools.)

### Tool invocation: correctness ≠ tool usage

- A correct final answer does not prove a tool was used. Models may answer from prior knowledge for well-known inputs (e.g. example.com). Tool validation must explicitly test invocation, not only output correctness.

### Eval design: explicit vs natural tool usage

- Evals that say “use the tool” confirm wiring works. Separate evals should test natural behaviour (URL present without instruction) to catch when the model bypasses tools.

### Eval coverage: safety cases

- Test not only successful tool use but also blocked and invalid inputs (e.g. localhost, malformed URLs) so security boundaries are verified, not just happy paths.

### Eval robustness: flexible matching

- Use `expectedAny` with multiple substrings to allow for model phrasing variation. Avoid brittle exact matches unless the contract truly requires them.

### Eval formatting: structure vs format

- Valid JSON alone is not enough: models may wrap JSON in markdown fences and break naïve parsing. Split checks: **structure** (`validJson`) and **format** (`noCodeFence`) for more reliable automation.

### Eval: known inputs can hide issues

- Well-known URLs can yield correct answers without tool usage. Prefer dynamic or less-known sources when validating that tools are actually used.

### Checks: minimal change indicates alignment

- If automated check generation only tweaks a little, the workflow likely already had sound structure (execution, ordering, failure handling).

### Checks design: label + execution pairing

- Each check should have a descriptive label (`echo`), a real command (`npm run build`), and correct failure propagation. Labels alone do not validate anything.

### Eval architecture: setup failure vs test failure

- Distinguish setup failures (e.g. no providers configured) from test failures (failed checks or tool behaviour). Both should fail the process, but separating them clarifies what broke.

### UI / tooling: generic pending state

- Use a shared helper (e.g. `isToolPartPending`) to detect in-flight tool states across multiple tools so new tools scale without one-off conditionals.

### System: build-pro on bounded features

- `/build-pro` works well for small, well-scoped features with clear patterns. Larger or riskier work may still benefit from pass-by-pass human review.

### workflow idea: chain review + validation into one shortcut

Consider refactoring the existing `ai-review` and `ai-review-validation` shortcuts into a single `ai-review` shortcut that runs both stages in sequence.

Goal:
- reduce context switching
- keep the review workflow smoother
- reuse the existing shortcuts/logic rather than rewriting the process

Important boundary:
- this shortcut should only combine analysis steps
- it should not implement fixes
- human decision-making remains separate after validated findings are returned

Intended flow:
1. Run external AI review
2. Run validation against the review findings
3. Output only validated / filtered findings
4. Stop and wait for human decision

Principle:
- bundle analysis
- separate decisions
- never auto-implement review findings