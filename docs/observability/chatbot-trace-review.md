# Chatbot Trace Review

## Status
Active

## Runtime Observability Findings

### Finding 1 - Successful generation traces are visible and useful

Severity: Low
Area: Trace completeness
Evidence: `docs/observability/chatbot-observe-traces.md` records three Langfuse/OpenTelemetry traces captured on 2026-05-09: a normal prompt, a `calculate` tool prompt, and a restricted `readFile` tool prompt. Each trace shows `chat.post.streamText`, nested `ai.streamText.doStream`, model metadata, token usage, latency, TTFT, and completion duration.
Real runtime impact: Happy-path generation can be debugged from runtime evidence, including model choice, timing, token use, and whether tool spans appeared.
Smallest practical improvement: Keep the existing `functionId` and metadata stable so future traces remain comparable.

### Finding 2 - Prompt and output privacy settings are preserved

Severity: Low
Area: Privacy / trace payloads
Evidence: `docs/observability/chatbot-observe-traces.md` reports raw prompt, assistant output, tool inputs, tool outputs, file contents, and secrets were not visible. `docs/observability/chatbot-observe-wire.md` documents `recordInputs: false` and `recordOutputs: false`.
Real runtime impact: The current traces are operationally useful without exposing chat contents, fetched content, file contents, bearer tokens, or provider keys.
Smallest practical improvement: Continue using safe metadata only; add redacted summaries rather than raw content if deeper debugging is needed later.

### Finding 3 - Failure-path traces are not represented

Severity: Low-Medium
Area: Failure visibility
Evidence: All documented traces completed successfully and show no provider errors, retry behaviour, stream crashes, malformed request paths, missing provider-key paths, or auth failures.
Real runtime impact: Normal chat debugging is workable, but incident debugging for rejected requests, bad payloads, missing config, provider failures, or stream failures would still rely on HTTP status/log context rather than complete traces.
Smallest practical improvement: Capture one synthetic failure run and add route-level error attributes or events for pre-generation exits.

### Finding 4 - Tool trace coverage is incomplete

Severity: Medium
Area: Tool spans
Evidence: Runtime evidence confirms `calculate` and restricted `readFile` tool spans. No `fetchUrl` trace evidence was found.
Real runtime impact: Filesystem and calculation flows can be inspected from the trace notes, but network-fetch behaviour is not yet reviewable from runtime traces.
Smallest practical improvement: Capture one `fetchUrl` runtime trace with safe result metadata such as tool name, result code, and duration.

## Runtime Strengths

- Langfuse/OpenTelemetry connection is active and backed by captured trace evidence.
- Stable `functionId` is present: `chat.post.streamText`.
- Safe metadata is present: `feature`, `route`, `selectedModel`, and `toolCount`.
- Latency, TTFT, token usage, provider, model, and finish reason are visible.
- Privacy posture is good for this phase because raw prompts and outputs are not captured.

## Residual Risks

- No failed provider, retry, bad-auth, malformed-body, missing-key, or unsupported-model traces were available.
- No `fetchUrl` trace was available.
- Only `gemini-2.5-flash` appears in the captured traces, despite other allowlisted models.
- Duplicate nested `ai.streamText.doStream` spans during tool flow may need interpretation later, but there is not enough evidence that this is harmful.

## Summary

- Overall trace usefulness: Active and useful for successful runtime generation, normal prompts, and two tool paths.
- Biggest visibility gap: failure paths and the missing `fetchUrl` runtime trace.
- Confidence level: Medium, because trace evidence is structured and concrete but narrow.
