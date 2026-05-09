# Chatbot Observability Summary

## Capability Status Summary

- Trace review: Active. Langfuse/OpenTelemetry traces exist for normal generation, `calculate`, and restricted `readFile`.
- Routing review: Partial. There is no classifier or multi-agent router; deterministic model selection and model-driven tool choice are partially visible.
- Guard review: Partial. Guard logic exists and one restricted `readFile` flow is evidenced, but most guard outcomes are not first-class trace evidence.
- Eval/runtime evidence: Partial. `evals.mjs` exists, but requested `docs/evals/chatbot-evals.md` was not present and no durable eval-output artefact or trace correlation was found.

## Runtime Strengths

- Langfuse/OpenTelemetry is connected and has actual runtime evidence, not just planned wiring.
- `chat.post.streamText` is a stable telemetry identifier.
- Traces include useful operational metadata: route, selected model, tool count, provider/model attributes, latency, TTFT, token usage, and finish reason.
- Prompt/output capture is disabled, and the reviewed traces did not expose prompts, assistant output, tool inputs, tool outputs, file contents, bearer tokens, or secrets.
- The restricted `readFile` flow completed safely without breaking the trace hierarchy.

## Key Findings

### Fix now

- No required immediate fix from the available runtime evidence.

### Defer

- Add first-class guard/failure observability for auth denial, malformed payloads, unsupported model, missing provider keys, stripped client `system` messages, and tool result codes.
- Capture one `fetchUrl` runtime trace with safe metadata.
- Save eval run summaries with date, provider, model, case ids, pass/fail status, and optional trace ids.
- Capture one synthetic failure-path trace or documented failure run.

### No action

- No classifier-routing observability is needed while the app has no classifier, confidence-based router, or multi-agent dispatch layer.
- No moderation/PII guard observability is required unless those capabilities are added as product requirements.

## Runtime Evidence Quality

Runtime debuggability is good for successful chat generation and two tool paths. Evidence completeness is narrower for failure paths, guards, evals, and the `fetchUrl` tool. Observability maturity is between Partial and Active: the trace pipeline is active, safe, and useful, but not yet broad enough for rejected-request or incident diagnosis. The biggest current gap is that guard and pre-generation failure outcomes are not first-class runtime evidence.

Confidence level: Medium. The available traces are structured and concrete, but they cover only successful Gemini runs plus two tool scenarios.

## Retro Notes

The observe workflow successfully moved from planned telemetry to real Langfuse trace evidence. The strongest instrumentation lesson is that stable `functionId` metadata plus disabled input/output capture gives useful operational visibility without leaking sensitive chat or tool contents. The main runtime debugging lesson is that tracing only the model call leaves early exits invisible. Future observability work should add small, privacy-safe guard and failure events before expanding into dashboards or broader eval ingestion.
