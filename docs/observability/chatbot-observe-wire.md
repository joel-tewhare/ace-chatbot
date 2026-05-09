# Chatbot observe-wire implementation

## Observability wiring implemented

- Added AI SDK `experimental_telemetry` to the primary `streamText` call in `POST /api/chat`.
- Set the stable telemetry `functionId` to `chat.post.streamText`.
- Added safe telemetry metadata: `feature`, `route`, `selectedModel`, and `toolCount`.
- Disabled prompt/input and response/output capture with `recordInputs: false` and `recordOutputs: false`.
- Gated the telemetry call with `AI_TELEMETRY_ENABLED=true` or `AI_TELEMETRY_ENABLED=1`.

This Phase 1 wiring uses the AI SDK's OpenTelemetry spans. It expects an OpenTelemetry provider/exporter to be configured by the runtime or deployment environment. No Langfuse-specific integration, custom exporter, dashboard, eval tracing, or manual tool spans were added in this pass.

## Files changed

- `app/api/chat/route.ts` - wires `experimental_telemetry` into the existing `streamText` call without changing model selection, prompts, tool definitions, guards, routing, or stream response behavior.
- `.env.example` - documents the `AI_TELEMETRY_ENABLED` toggle.
- `docs/observability/chatbot-observe-wire.md` - records the Phase 1 implementation, expected runtime evidence, verification steps, deferred work, and privacy notes.

## Expected runtime evidence

- Root AI SDK span: `ai.streamText chat.post.streamText`
- Provider stream span: `ai.streamText.doStream chat.post.streamText`
- Function/resource attributes:
  - `ai.telemetry.functionId`: `chat.post.streamText`
  - `resource.name`: `chat.post.streamText`
- Metadata attributes:
  - `ai.telemetry.metadata.feature`: `chatbot`
  - `ai.telemetry.metadata.route`: `POST /api/chat`
  - `ai.telemetry.metadata.selectedModel`: selected allowlisted model, such as `gemini-2.5-flash`
  - `ai.telemetry.metadata.toolCount`: `3`
- Standard AI SDK model and timing attributes should appear when the runtime has an active OpenTelemetry tracer/exporter, including model/provider metadata and stream timing such as first chunk and finish duration where supported.

## Verification steps

1. Configure the Next.js runtime with an OpenTelemetry provider/exporter supported by the target environment.
2. Set `AI_TELEMETRY_ENABLED=true` in the local or deployed environment.
3. Start the app with `npm run dev` or deploy through the configured environment.
4. Send an authenticated chat request through the UI or `POST /api/chat`.
5. In the observability backend, search for `chat.post.streamText`.
6. Confirm a trace contains `ai.streamText chat.post.streamText` and `ai.streamText.doStream chat.post.streamText`.
7. Confirm metadata includes the selected model and route, and that prompt/output bodies are absent because input and output recording are disabled.
8. Optionally send a prompt that uses `calculate`, `readFile`, or `fetchUrl` and confirm the main stream trace still records. Detailed tool span review is deferred.

Checks and evals were intentionally not run for this observe-wire pass.

## Deferred observability work

- Add a concrete OpenTelemetry bootstrap file, such as `instrumentation.ts`, once the target backend/exporter package is selected.
- Add provider/exporter dependencies, for example a Vercel/OpenTelemetry/Langfuse-compatible exporter, when approved.
- Add route-level manual spans for validation failures, provider-key missing paths, auth outcomes, and stream errors.
- Add per-tool spans or telemetry redaction for `calculate`, `readFile`, and `fetchUrl`.
- Add eval/CLI tracing and explicit flush/shutdown handling for `evals.mjs`.
- Add trace correlation for sessions or conversations if the client later sends a stable conversation id.

## Privacy / secrets notes

- `recordInputs: false` and `recordOutputs: false` are set so user messages, file contents, fetched page excerpts, and assistant responses are not captured by AI SDK telemetry attributes.
- Telemetry metadata records the selected model id but not bearer tokens, `CHAT_API_SECRET`, provider API keys, raw prompts, raw tool inputs, or raw tool results.
- `NEXT_PUBLIC_CHAT_API_SECRET` remains a browser-visible dev gate; observability code must not log or emit it.
- Direct REST/helper internals such as `runFetchUrlTool` are not manually traced in Phase 1, so detailed fetch/read failure codes will not appear until a later tool-span pass.
