# Chatbot input and output guards

## `guardInput` (`lib/guards.ts`)

Runs on the **latest user message** text in `POST /api/chat` **before** `convertToModelMessages` and `streamText`.

1. **Zod** — `UserInput`: `text` string, length 1–4000.
2. **Jailbreak / prompt extraction** — blocked via regex (`ignore … instructions`, `reveal … system prompt`, etc.).
3. **PII redaction** — emails → `[EMAIL]`, phone-like digit groups → `[PHONE]` (**before** moderation so raw PII is not sent to Gemini).
4. **Gemini moderation** — `generateText` with `gemini-2.5-flash` on **redacted** text only; compact JSON `{ "safe": boolean, "reason": "ok" | "unsafe_content" | "moderation_uncertain" }` with hardened parsing (fences stripped, first object extracted). Requires `GOOGLE_GENERATIVE_AI_API_KEY`.

If the message is only whitespace after redaction, the request is rejected with a coarse error (no logging of content).

`guardInput` returns `{ text, telemetry }` where `telemetry` is coarse counts and enums only (no message bodies, PII values, or moderation JSON).

Failures use `GuardError` with coarse HTTP messages (no raw user text in responses or logs from this layer).

## Langfuse / OpenTelemetry (input guard only)

When the request passes `guardInput` and reaches `streamText`, `experimental_telemetry.metadata` includes the existing fields plus:

- `guardStatus`: `allowed` | `redacted` (whether any email/phone pattern was redacted)
- `moderationChecked`: `true` when Gemini moderation completed for this turn
- `redactionCount`: number of email + phone matches removed (integer)
- `redactionTypes`: subset of `email`, `phone`

`recordInputs` and `recordOutputs` stay **false**; prompts and completions are not written to telemetry. No URLs, file paths, tokens, or moderation responses are added to metadata.

**Not traced:** Rejections before `streamText` (invalid input, jailbreak, unsafe moderation, missing keys, etc.) still produce **no** Langfuse trace from this pass—no manual spans or pre-stream telemetry yet.

## `guardOutput`

Exported for **non-streaming**, **audit**, or **future buffered** assistant text. It **redacts PII in a copy** sent to Gemini for moderation, then returns the **original** string if safe, or throws `GuardError` if not.

## Streaming limitation

The chat route uses **`streamText`** and returns a UI stream. **Output is not moderated token-by-token** in this pass; forcing that would need buffering or post-stream handling and is intentionally deferred. `guardOutput` is available when full assistant text is available in one string.

## Deferred

- Streaming output moderation (buffered completion or post-run audit).
- Broader PII or locale-specific phone patterns.
- Optional moderation bypass or separate policy knobs (not implemented).
- JSON extraction that handles `{` inside string values in malformed model output (current brace-count extractor assumes compact moderation JSON).
