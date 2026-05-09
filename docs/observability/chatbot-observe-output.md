Runtime observability review completed using `observe-review` and the `observe-reviewer` agent.

Created:

- `docs/observability/chatbot-trace-review.md`
- `docs/observability/chatbot-routing-review.md`
- `docs/observability/chatbot-guard-review.md`
- `docs/observability/chatbot-observe-summary.md`

Summary: trace observability is Active; routing and guards are Partial. Runtime evidence is strong for successful Langfuse traces, safe metadata, privacy-preserving input/output settings, and observed `calculate` plus restricted `readFile` flows. Biggest gap: guard and pre-generation failure outcomes are not first-class trace evidence.
