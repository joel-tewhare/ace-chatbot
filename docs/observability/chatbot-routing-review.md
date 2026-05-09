# Chatbot Routing Review

## Status
Partial

## Routing Findings

### Finding 1 - No classifier or multi-agent router is present

Severity: Low
Area: Routing capability
Evidence: The runtime route uses deterministic model selection from a request `model` value and an allowlist. No intent classifier, confidence score, fallback router, or multi-agent dispatch evidence was found.
Real runtime impact: There is no separate LLM routing layer to debug. Missing router observability is not a failure at this project stage.
Smallest practical improvement: No routing observability is required unless the app later adds classifier, confidence-based dispatch, or multi-agent routing.

### Finding 2 - Model selection is visible only as selected metadata after generation begins

Severity: Low-Medium
Area: Model selection visibility
Evidence: Captured traces include `selectedModel: gemini-2.5-flash`. Unsupported model and missing provider-key paths return before `streamText`, so they are not represented in the documented traces.
Real runtime impact: Successful model selection can be filtered in Langfuse, but rejected model/config paths are not visible as trace evidence.
Smallest practical improvement: Add a minimal route-level event or span for unsupported model and missing provider-key outcomes if those paths need operational visibility.

### Finding 3 - Tool selection evidence is useful but incomplete

Severity: Medium
Area: Tool selection
Evidence: `docs/observability/chatbot-observe-traces.md` records `calculate` and `readFile` tool spans. No `fetchUrl` trace evidence was found.
Real runtime impact: Tool choice is partially debuggable from traces, but one of the three exposed tools lacks runtime evidence.
Smallest practical improvement: Capture a `fetchUrl` trace and include safe tool metadata such as tool name, result code, and duration.

## Routing Strengths

- Deterministic model allowlisting reduces routing ambiguity.
- Successful traces include selected model metadata.
- Tool spans appear for observed `calculate` and `readFile` flows.
- Plain prompts do not show unnecessary tool spans in the documented normal prompt trace.

## Residual Risks

- No confidence scores exist because there is no confidence-based router.
- No runtime evidence covers unsupported model fallback/rejection.
- No `fetchUrl` tool-selection evidence was found.
- Non-Gemini allowlisted models were not represented in captured traces.

## Summary

- Routing maturity: Partial. There is no router, but deterministic model selection and model-driven tool choice have partial trace evidence.
- Confidence visibility quality: Not applicable for classifier routing; adequate for successful selected-model metadata.
- Routing debuggability: Good for successful model choice and two observed tool choices, incomplete for rejected model paths and `fetchUrl`.
