# Chatbot observability — observe plan

**Context note:** Requested paths such as `docs/plans/chatbot.md`, `docs/builds/chatbot-build-pro.md`, `docs/builds/chatbot-pass-*.md`, `docs/wire-plans/chatbot-wire-plan.md`, `docs/checks/chatbot-checks.md`, `docs/evals/chatbot-evals.md`, `docs/reviews/chatbot-review.md`, `docs/review-validations/chatbot-validation.md`, `docs/security-audits/chatbot-security-audit.md`, and `docs/security-validations/chatbot-security-validation.md` were **not found** in this repository. This plan is grounded in the **ace-chatbot** implementation (`app/api/chat/route.ts`, `app/page.tsx`, `lib/fetchurl.mjs`, `evals.mjs`), automation (`checks.sh`, `evals.mjs`), `memory.md`, `package.json`, and existing feature/build docs under `docs/features/`, `docs/builds/`, etc. (`instrumentation.ts` and `lib/**/telemetry.ts` are also **absent**.)

---

### Observe Plan Summary

- The app is a **Next.js API chat route** using **Vercel AI SDK `streamText`** with three tools (`calculate`, `readFile`, `fetchUrl`) and **`stepCountIs(5)`**; there is **no OpenTelemetry, Langfuse, or `instrumentation.ts`** in the repo today.
- **Runtime evidence** for AI behaviour currently comes from **manual UI testing**, **`npm run build`** (`checks.sh`), and **`npm run eval:run`** (`evals.mjs`), which logs provider outputs and boolean heuristic checks to stdout—**not** from distributed traces or a trace backend.
- **Trust-relevant behaviour** (bearer auth, stripping client `system` messages, filesystem/URL policies) is implemented in code but **not** emitted as structured observability events.
- **AI/runtime observability is not yet useful** for answering “what happened in production?” beyond app logs; it **is** partially useful for regression-style checks via evals when run deliberately.
- **Recommended first milestone:** prove **one end-to-end trace** (or AI SDK experimental telemetry export) for the **primary `streamText` call** in `POST /api/chat`, with safe metadata (model id, success/failure, latency), before expanding to tool spans or eval linkage.

---

### Current Runtime Evidence Map

**AI model calls**

- **Status:** Active (no trace export).
- **Evidence:** `app/api/chat/route.ts` (`streamText`); `evals.mjs` (`generateText` plain and with tools).
- **Notes:** Multi-provider routing is **deterministic** (env keys + model id prefix), not an LLM router.

**Trace / telemetry setup**

- **Status:** Not present.
- **Evidence:** No `instrumentation.ts` (file missing); no `lib/**/telemetry.ts`; `next.config.ts` has no instrumentation hook; `package.json` has no OpenTelemetry/Langfuse/LangSmith dependencies.
- **Notes:** Any future setup must distinguish **Next server runtime** vs **Node CLI** (`evals.mjs`).

**Routing**

- **Status:** Not present (in the sense of classifier / intent router / multi-agent routes).
- **Evidence:** Client sends `model` string; server validates against `SUPPORTED_MODELS` (`app/api/chat/route.ts`).
- **Notes:** **Tool choice** is model-driven inside `streamText`; there is no separate routing layer to instrument except optional spans around “which tool ran.”

**Guards**

- **Status:** Partial (policy in code, not as observability events).
- **Evidence:** `CHAT_API_SECRET` + timing-safe bearer check; malformed body → `400`; missing config → `503`/`401`; client `system` messages **filtered out** before `convertToModelMessages`; `readFile` blocks `.git`, `node_modules`, `.env*`, symlink-resolved paths; `fetchUrl` validates URL in `lib/fetchurl.mjs` (blocked hosts, etc.).
- **Notes:** Moderation/PII/red-team guards are **not** implemented as separate subsystems.

**Tools / actions**

- **Status:** Active (side effects; no trace spans).
- **Evidence:** `calculateTool`, `readFileTool`, `fetchUrlTool` in `app/api/chat/route.ts`; `runFetchUrlTool` in `lib/fetchurl.mjs`; mirrored tools in `evals.mjs` with explicit “keep in sync” comments.
- **Notes:** Highest-impact observability targets after the main model span: **tool name, inputs (redacted), latency, ok/fail codes** (`readFile` / `fetchUrl` structured results).

**Evals / red-team**

- **Status:** Partial (scripted checks, console only).
- **Evidence:** `evals.mjs` — prompts, substring/JSON heuristics, non-zero exit on failures; `checks.sh` reminds to run evals after model/prompt changes; `memory.md` documents eval strictness and mirror-sync expectations.
- **Notes:** No saved trace correlation, no Langfuse scores, no promptfoo-style artefacts in-repo beyond logs.

**CLI / scripts**

- **Status:** Active.
- **Evidence:** `evals.mjs` via `npm run eval:run` (`package.json`); uses `dotenv` for `.env.local`.
- **Notes:** If traces are added here, plan for **flush/shutdown** so short-lived Node processes do not drop export batches.

---

### AI Call Inventory

1. **File:** `app/api/chat/route.ts`  
   **Function / route / script:** `POST` handler → `streamText`  
   **Provider / SDK:** Vercel AI SDK `streamText`; `@ai-sdk/google` | `@ai-sdk/openai` | `@ai-sdk/anthropic`  
   **Model if visible:** `gemini-2.5-flash` (default), `gemini-2.5-pro`, `gpt-4.1`, `claude-sonnet-4-20250514` (from allowlist + request body)  
   **Input type:** UIMessage-derived model messages after `convertToModelMessages`; tools registered  
   **Output type:** UI message stream (`toUIMessageStreamResponse`)  
   **Current observability:** HTTP status + implicit framework logging only  
   **Recommended instrumentation:** Phase 1 — single parent span or AI SDK telemetry for this `streamText` invocation; attach **model id**, **request outcome**, **duration**; avoid full prompt logging initially or redact  
   **Priority:** High  

2. **File:** `evals.mjs`  
   **Function / route / script:** `runOne` → `generateText`  
   **Provider / SDK:** `ai` `generateText`; same three `@ai-sdk/*` providers as route  
   **Model if visible:** `gemini-2.5-flash`, `gpt-4.1`, `claude-sonnet-4-20250514` (whichever env keys exist)  
   **Input type:** Plain string prompts  
   **Output type:** Text  
   **Current observability:** `console.log` of text + heuristic `checks` object  
   **Recommended instrumentation:** Phase 2 — optional trace per eval case **or** link eval run id in span metadata; ensure **process exit** flushes exporters  
   **Priority:** Medium  

3. **File:** `evals.mjs`  
   **Function / route / script:** `runOneWithTools` → `generateText` with `chatTools`, `stopWhen: stepCountIs(5)`  
   **Provider / SDK:** `ai` `generateText` + tools  
   **Model if visible:** Same as (2)  
   **Input type:** String prompts + tool definitions mirroring route  
   **Output type:** Text after tool loop  
   **Current observability:** Console logs + boolean checks  
   **Recommended instrumentation:** Phase 3 — child spans or events per **tool invocation** (name, duration, result summary without raw file/URL content)  
   **Priority:** Medium  

---

### Recommended Observability Setup

#### Phase 1 — Minimal useful tracing

- **Goal:** After one real chat request, a backend shows **one coherent trace** (or one root span) for the server-side generation.
- **Likely packages (plan only — not installed in this pass):** e.g. OpenTelemetry Node SDK + OTLP exporter **and/or** Vercel AI SDK **experimental telemetry** to a compatible backend—choice should match hosting constraints (Next 16 serverless vs long-running).
- **Likely env vars (plan only):** OTLP endpoint URL, optional headers/API key for the trace backend; **keep separate** from `GOOGLE_GENERATIVE_AI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `CHAT_API_SECRET`.
- **Entry files (future):** Next **`instrumentation.ts`** (if using Node OTEL bootstrap for the server bundle), **or** telemetry options passed into `streamText` only (lighter footprint).
- **First AI call to instrument:** `streamText` in `app/api/chat/route.ts` **after** auth and payload validation succeed.
- **Expected trace/function name:** Stable identifier such as `chat.post.streamText` or AI SDK default generation span name—**pick one convention** and document it next to implementation.
- **Verification steps:**
  - Send an authenticated chat message from the UI.
  - Confirm a trace appears with duration and model metadata.
  - Trigger a **tool-using** prompt (optional second step) to confirm the trace still records (even if tool detail is minimal in Phase 1).

#### Phase 2 — Runtime clarity improvements

- Add **stable function / operation IDs** for the chat route vs eval script.
- Attach **metadata:** selected model, HTTP status path (for early exits, consider **optional** short attributes—not full bodies).
- Add **session or conversation grouping** if the client exposes a stable id later (today `useChat` messages only; no explicit session id in route).
- Improve **failure visibility:** annotate spans on `convertToModelMessages` failures, provider 503 paths, and stream errors.
- **Prompt/input/output visibility:** prefer **sampling + redaction**; log hashes or lengths before full content.

#### Phase 3 — Advanced observability

- **Per-tool spans or events** for `calculate`, `readFile`, `fetchUrl`: duration, tool name, structured **error codes** (`ReadFileErrorCode`, `fetchUrl` `code`), **no** full file contents or full fetched HTML in traces by default.
- **Link eval runs** to traces or store eval run id in span metadata for post-hoc correlation (`evals.mjs` test ids).
- **Guard-adjacent signals:** optional events when **client `system` messages are stripped**, auth failures (count only, no secret values), or URL/host blocks—useful for security review loops without replacing audits.

---

### Suggested Files to Change Later

_Not edited in this observe-plan pass._

- **Telemetry bootstrap:** `instrumentation.ts` (new), possible `lib/telemetry.ts` or `lib/observability.ts` (new), `next.config.ts` if Next requires experimental flags for instrumentation hook.
- **Primary AI call:** `app/api/chat/route.ts` (`streamText` options / wrapping).
- **Shared tool logic:** `lib/fetchurl.mjs` (optional low-level span around `runFetchUrlTool` if not covered by AI SDK tool telemetry).
- **Eval CLI:** `evals.mjs` (telemetry init + flush on exit).
- **Dependencies:** `package.json` / lockfile when implementing.

---

### Verification Plan

- **One runtime action to trigger:** Open the app, send a normal user message **with valid bearer auth**, after Phase 1 wiring.
- **Expected trace name/functionId:** The agreed stable name for the chat completion span (see Phase 1).
- **Expected observation data:** End-to-end latency; attribute for **model id**; status ok/error; optionally step count if exposed by SDK.
- **If traces are empty:** Confirm OTLP endpoint reachable from dev machine; confirm instrumentation loads in Next (**instrumentation hook** not tree-shaken); confirm API route runs in runtime that loads OTEL; for serverless, confirm **export flush** before response freeze.
- **CLI scripts:** `evals.mjs` should call **flush/shutdown** on the tracer provider before `process.exit` when using batch exporters.

---

### Risks / Privacy Notes

- **Prompts and assistant outputs may contain user data**; traces must default to **redaction, truncation, or sampling**.
- **Tool payloads** may include **file excerpts** or **page text**; avoid capturing full content in span attributes.
- **`NEXT_PUBLIC_CHAT_API_SECRET` is visible to the browser** (dev-gate pattern); observability must **never** log bearer tokens or `CHAT_API_SECRET` values.
- **Provider API keys** must remain **server-side only**; distinguish observability backend keys from model keys in env naming and docs.

---

### Defer

- Full **dashboards** and SLAs before baseline traces work.
- **Langfuse-specific** prompt management, scoring pipelines, or eval storage—until export path is proven.
- **LLM-based routing observability** until a real router or multi-agent graph exists.
- **Deep packet-level network observability** for `fetchUrl` beyond duration/outcome unless SSRF reviews require it.
- **Manual spans for every HTTP helper**—prefer one clear generation span first.

---

### Recommended Next Step

**Run `/observe-wire` for Phase 1 only:** add the smallest wiring that yields **one visible trace** for `streamText` in `app/api/chat/route.ts`, verify in the chosen backend, then iterate to tool-level detail.
