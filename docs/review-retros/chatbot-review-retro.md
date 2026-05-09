### Review retro summary
- The requested secondary review, validation, and implementation artifacts for `chatbot` are not present at the specified paths, so there is no grounded accept/reject/implemented chain to close out.
- Current verification evidence exists only in `docs/checks/chatbot-checks.md` and `docs/evals/chatbot-evals.md`.
- Deterministic checks passed via `next build`.
- Evals mostly passed, but the JSON-only prompt failed strict JSON parsing because the model wrapped JSON in a markdown fence.
- `memory.md` already captures the durable JSON-eval lesson: strict JSON contracts should fail fenced output and separate structure from format checks.
- No new memory note is justified without the missing review, validation, and implementation artifacts.

### Worth keeping
- Keep treating check/eval logs as evidence only when they can be tied to the implemented revision or explicitly described as general regression evidence.
- Keep JSON-only evals strict: fenced JSON is not valid JSON-only output for automation.

### Rejected or not useful
- No reviewer suggestions can be classified as accepted, rejected, or implemented because the review/validation/implementation inputs are absent.
- The available eval failure is useful evidence, but it is not enough by itself to infer a secondary-review finding or implementation decision.

### Candidate memory notes (append-ready)
Memory alignment: already covered in `memory.md` under `Project deliverables` and `Build-pro, checks, and evals — post-implementation notes`, especially strict JSON evals, code-fence failures, and distinguishing captured logs from regression coverage.

### Memory outcome
**Memory update:** **Deferred** — reconcile later in `/retro`; candidates: verification provenance for chatbot review artifacts, if the missing review/validation/implementation notes are restored.
