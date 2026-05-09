# Chatbot observe-connect (Langfuse)

## What was connected

- Registered a **Node.js OpenTelemetry** `NodeTracerProvider` with Langfuse’s **`LangfuseSpanProcessor`**, following Langfuse’s Vercel AI SDK + Next.js guidance (manual `NodeTracerProvider` rather than `@vercel/otel` due to OpenTelemetry JS v2 alignment).
- Left **AI SDK** `experimental_telemetry` as implemented in observe-wire: same `functionId`, **`recordInputs: false`**, **`recordOutputs: false`**, and **`AI_TELEMETRY_ENABLED`** gating on the `streamText` call.
- Added a **`next/server` `after()`** hook on successful chat handler paths that returns a stream, calling **`LangfuseSpanProcessor.forceFlush()`** so spans are pushed before the serverless/runtime unit shuts down.

No new spans, tools, prompts, auth, routing, or model logic were added. No raw prompt/output capture was enabled.

## Files changed

- `instrumentation.ts` (new) — `register()` starts the tracer provider when running on the **Node** runtime, **`LANGFUSE_PUBLIC_KEY`** and **`LANGFUSE_SECRET_KEY`** are set, and **`AI_TELEMETRY_ENABLED`** is `true` or `1`. Exports flush helpers used by the API route.
- `app/api/chat/route.ts` — schedules **`flushLangfuseTelemetry()`** via **`after()`** when Langfuse OTel registration is active, without changing stream construction or telemetry settings on `streamText`.
- `.env.example` — documents **`LANGFUSE_PUBLIC_KEY`**, **`LANGFUSE_SECRET_KEY`**, and **`LANGFUSE_BASE_URL`** (names and placeholders only).

## Packages added

- `@langfuse/otel`
- `@opentelemetry/sdk-trace-node`

(transitive OpenTelemetry packages are resolved via these dependencies.)

## Environment variables required

| Variable | Purpose |
|----------|---------|
| `AI_TELEMETRY_ENABLED` | Must be `true` or `1` so AI SDK emits spans **and** so `instrumentation.ts` registers the Langfuse exporter pipeline. |
| `LANGFUSE_PUBLIC_KEY` | Langfuse project public key (human-managed secret). |
| `LANGFUSE_SECRET_KEY` | Langfuse project secret key (human-managed secret). |
| `LANGFUSE_BASE_URL` | Optional region/host; see `.env.example` for the default Langfuse Cloud EU host. |

Do **not** commit real keys. Do not paste secret values into `docs/observability/` files.

## Manual setup steps

1. Create or open a Langfuse project and copy **public** and **secret** API keys from the project settings.
2. Add to **`.env.local`** (or your host’s secret store): `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and `LANGFUSE_BASE_URL` if not using the default region.
3. Set `AI_TELEMETRY_ENABLED=true`.
4. Restart the Next.js dev server or redeploy so `register()` runs with the new env.

## Automated verification run

- `npm run build` — completed successfully after these changes.

## Manual verification still required

1. With Langfuse keys and `AI_TELEMETRY_ENABLED=true`, restart the app.
2. Send an **authenticated** `POST /api/chat` request (same auth as before this change).
3. In Langfuse, search traces for **`chat.post.streamText`** or for span names **`ai.streamText chat.post.streamText`** / **`ai.streamText.doStream chat.post.streamText`** (see observe-wire doc for full attribute list).
4. Confirm **no** full user prompts or assistant completions appear in trace input/output (they should remain absent because `recordInputs` / `recordOutputs` stay `false`).
5. Confirm **safe** metadata is present where Langfuse surfaces AI SDK telemetry metadata, e.g. **`ai.telemetry.metadata.feature`**: `chatbot`, **`ai.telemetry.metadata.route`**: `POST /api/chat`, **`ai.telemetry.metadata.selectedModel`**, **`ai.telemetry.metadata.toolCount`**.

If traces do not appear, Langfuse documents suggest `LANGFUSE_LOG_LEVEL=DEBUG` and confirming **`forceFlush`** runs in short-lived environments; this repo schedules flush after the chat stream response is returned.

## Privacy notes

- Observe-wire privacy settings are **unchanged**: **no** AI SDK capture of user prompts or model outputs.
- Observability docs and `.env.example` list **variable names only**, not secrets.
- Do not log bearer tokens, **`CHAT_API_SECRET`**, provider keys, or Langfuse keys in application code.

## Deferred (out of observe-connect scope)

- Broader OpenTelemetry sharing with other vendors, sampling policy, dashboards, eval ingestion, Langfuse prompt management, scores, datasets.
- Extra manual spans for auth failures, tool calls, or CLI **`evals.mjs`** (unchanged by this pass).
