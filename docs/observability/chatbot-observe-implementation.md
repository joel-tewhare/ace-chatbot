# Chatbot observe-wire implementation

Outcome of implementing `docs/observability/chatbot-observe-validation.md` (**observe-fix contract**).

## Observability findings implemented

**None.** Under **Fix now**, the validation artefact states only that **nothing is mandatory**: archived traces and code paths support the conclusion that there is no immediate production fix; gaps called out elsewhere are primarily **visibility**, not demonstrated correctness bugs.

No additional instrumentation, env docs, or routing/guard/privacy changes were applied for this pass, so deferred gaps remain intentionally untouched.

## Files changed

| File | Change |
|------|--------|
| `docs/observability/chatbot-observe-implementation.md` | Created this summary for the observe-fix pass. |

No changes to `app/api/chat/route.ts`, `instrumentation.ts`, `.env.example`, eval runners, or checks scripts.

## Behaviour changes

**None.** Product behaviour, prompts, schemas, models, routing, and guards are unchanged.

## Expected trace / span / functionId changes

**None** from this pass. Existing expectations remain as documented in `chatbot-observe-connect.md` / archived traces (for example `functionId` `chat.post.streamText` / `CHAT_STREAM_FUNCTION_ID`, privacy settings `recordInputs` / `recordOutputs` false, metadata keys such as `feature`, `route`, `selectedModel`, `toolCount`).

## Findings intentionally not implemented

Per validation **Defer** (and **Partially accept** operational follow-ups), the following were **not** implemented in this pass:

- Route-level or minimal spans/events for **early exits** (auth, payload, model allowlist, missing provider keys, etc.).
- **`fetchUrl` trace** sampling and optional blocked-host / guard traces.
- **Tool result codes** as safe telemetry metadata (`readFile`, `fetchUrl`).
- **`strippedSystemCount`** (or equivalent) for client `system` stripping observability.
- **Eval documentation** (`docs/evals/chatbot-evals.md` is still missing per validation), saved run summaries, and optional Langfuse trace correlation.
- Investigation or changes for **duplicate nested `doStream`** spans (deferred pending more evidence).

**No action** items from validation (classifier routing, moderation/PII, privacy posture changes) were also not implemented.

## Checks / evals to rerun

Not run in-agent per workflow. When validating the repo after future observe-fix work, prefer:

- `./checks.sh` (project validation script).
- `npm run eval:run` (`evals.mjs`).

After any future instrumentation changes with Langfuse/OTEL enabled, trigger a manual chat request and confirm traces in the observability UI.

## Notes for retro

- Treat **`chatbot-observe-plan.md` as historical** where it contradicts current layout (`instrumentation.ts`, OTEL/Langfuse deps, `after()` flush)—validation already notes this.
- **Fix now empty** is an explicit contract outcome: document “no mandatory code changes” passes so stakeholders do not assume silence means drift from validation.
- **Deferred visibility gaps** (pre-`streamText` exits, `fetchUrl` traces, tool outcome codes, eval artefacts vs traces) remain the natural backlog if the next pass promotes items from Defer to Fix now.
- When claiming “validated,” align language with whether checks/evals and traces were actually run (`memory.md` already warns on skipped validation).
