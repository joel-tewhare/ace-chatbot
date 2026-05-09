# Chatbot Guard Review

## Status
Partial

## Guard Findings

### Finding 1 - Restricted `readFile` behaviour is visible only indirectly

Severity: Medium
Area: Tool guard visibility
Evidence: The restricted `readFile` trace completed successfully, emitted a `readFile` tool span, and did not expose file contents or restricted path data. The trace notes describe denial visibility as indirect.
Real runtime impact: Operators can see that a guarded tool flow completed safely, but cannot inspect a first-class guard outcome such as `access_denied` from the documented trace evidence.
Smallest practical improvement: Add safe tool-result metadata or events for guard result code, avoiding raw paths and file contents.

### Finding 2 - Pre-generation request guards are not trace-visible

Severity: Medium
Area: Request guards
Evidence: Auth failure, malformed JSON, invalid messages, empty non-system messages, unsupported model, and missing provider-key paths return before the traced `streamText` call. No runtime trace evidence was found for those guard outcomes.
Real runtime impact: Rejected requests cannot be distinguished in Langfuse from the current trace evidence; debugging depends on HTTP status handling or external logs.
Smallest practical improvement: Add minimal route-level guard events or spans for `auth.denied`, `payload.invalid`, `model.unsupported`, and `provider_key.missing`, with no secrets or raw payloads.

### Finding 3 - Client `system` message stripping is implemented but not observable

Severity: Low-Medium
Area: Prompt guard visibility
Evidence: The route strips client-supplied `system` messages before `convertToModelMessages`, but no trace metadata or runtime event records whether stripping occurred.
Real runtime impact: A prompt-injection-relevant guard can work correctly while remaining invisible during runtime review.
Smallest practical improvement: Record a count-only event or metadata field when client `system` messages are stripped.

### Finding 4 - Moderation and PII guard capabilities are not present

Severity: Low
Area: Guard capability
Evidence: No runtime evidence showed moderation, PII redaction, or separate safety-classifier guards. The observed privacy posture comes from telemetry settings and tool/path policies rather than a moderation subsystem.
Real runtime impact: Absence is not automatically a failure for this tutorial-stage chatbot, but those outcomes cannot be reviewed as guard telemetry.
Smallest practical improvement: No moderation observability is required unless moderation or PII filtering becomes a product requirement.

## Guard Strengths

- Restricted `readFile` access completed safely without trace leakage.
- Raw prompts, outputs, tool inputs, tool outputs, file contents, and secrets were not visible in traces.
- Auth, payload validation, model allowlisting, provider-key checks, and client `system` stripping exist as runtime guard surfaces.
- Tool result contracts use structured failure codes for `readFile` and `fetchUrl`, which are suitable for future safe observability.

## Residual Risks

- Guard outcomes are not first-class runtime trace evidence.
- Auth failures and malformed requests are not visible in Langfuse traces.
- No false-positive or false-negative guard evidence was available.
- `fetchUrl` blocked-host guard behaviour was not represented in captured traces.

## Summary

- Guard visibility maturity: Partial.
- Rejection clarity: Clear in application responses and tool contracts, but mostly absent or indirect in runtime traces.
- Biggest missing guard surface: first-class observability for pre-generation exits and tool guard result codes.
