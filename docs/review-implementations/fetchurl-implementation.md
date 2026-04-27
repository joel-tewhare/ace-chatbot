# fetchUrl validation — implementation summary

This document records what was implemented from `docs/review-validations/fetchurl-validation.md` (**Fix now** only).

## Findings implemented

1. **Link-local / metadata IPv4 range (Finding 1 — quick win)**
  Extended `validatePublicHttpUrl` to block `**169.254.0.0/16`** (e.g. `169.254.169.254`) on the initial URL hostname, closing a gap called out in the validation (direct requests to link-local / instance metadata style addresses were not covered by existing RFC1918 / loopback rules).

The narrative bullets under Fix now about `redirect: 'follow'`, DNS-to-private resolution, and aligning the full “public URL only” contract were **not** implemented as code in this pass; the validation artefact defers manual redirect handling, per-hop `Location` validation, and resolve-then-validate to **Defer**.

## Files changed


| File               | Change                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `lib/fetchurl.mjs` | In the IPv4 literal branch of `validatePublicHttpUrl`, reject `a === 169 && b === 254` with existing `blocked_host` message. |


## Behaviour changes

- **fetchUrl / `validatePublicHttpUrl`:** URLs whose host is an IPv4 address in **169.254.0.0/16** now fail validation with the same `**blocked_host`** code and user-facing message as other blocked local/private hosts. No change to redirect behaviour, `Accept` headers, content-type handling, or eval/route wiring.

## Findings intentionally not implemented

- **Defer — Finding 2:** Deterministic unit tests or scripts for URL policy.
- **Defer — Finding 1 (full hardening):** Manual redirects (`redirect: 'manual'`), capped hops, re-validation of each `Location`, DNS / pre-resolve checks.
- **Defer — Finding 3:** Narrowing `Accept` or rejecting non-text `content-type` responses.
- **No action — Finding 4:** Eval triage (JSON fence / readFile missing-file rows vs fetchUrl).
- **N/A — Finding 5:** Positive confirmation only; no product change.

## Evidence

- **Code-grounded validation:** yes (see `docs/review-validations/fetchurl-validation.md` and narrative in this doc).
- **Checks / evals:** not run in this pass.

## Checks / evals to rerun

Per task instructions, checks and evals were **not** run as part of this pass. After merging, rerun as appropriate for your workflow, for example:

- Production build / project checks consistent with `docs/checks/fetchurl-checks.md`.
- `npm run eval:run` if you refresh `docs/evals/fetchurl-evals.md` or validate tool behaviour end-to-end.

## Notes for review-retro

- **Smallest hardening applied:** Single new branch in `validatePublicHttpUrl` for **169.254/16**; redirects and DNS bypass remain as documented in the validation **Defer** section.
- **Single source of policy:** Future URL rules should stay centralized in `lib/fetchurl.mjs` so the chat route and `evals.mjs` stay aligned via the shared `runFetchUrlTool` / `validatePublicHttpUrl` imports.
- **Threat model:** Direct metadata / link-local literals are reduced; “public hostname → private IP” and “first hop public → redirect to internal” are still out of scope until deferred work lands.

