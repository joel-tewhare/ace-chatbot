### Review retro summary

- The symlink finding was the main useful review item: the policy needed to apply to the canonical file target, not just the lexical path.
- The implementation followed through by using `realpath`, reading from the canonical path, mirroring the policy in `evals.mjs`, and adding a symlink-to-`.git/HEAD` eval.
- The UI finding was also valid and implemented: pending `readFile` tool state should render even before assistant text exists.
- The JSON eval failure was correctly treated as strict-output behavior, not a readFile product bug.
- Full checks and evals passed after implementation, including the new symlink-blocking eval.

### Worth keeping

- Trust-boundary checks must validate the thing actually acted on. For filesystem reads, that means canonical target path, not only user-provided or resolved lexical path.
- Mirrored eval logic can hide the same bug as production logic unless policy changes update both sides and add a case that would previously fail.
- Tool parts are displayable UI state even when no text part has streamed yet.

### Rejected or not useful

- Treating fenced JSON as a readFile regression was not useful; it belongs to strict JSON-output evaluation.
- Broader portability work, such as Windows path edge cases, was intentionally out of scope for this pass.
- Re-running the old evals without adding the symlink case would not have meaningfully tested the accepted security finding.

### Candidate memory notes (append-ready)

- For file-reading tools, enforce access policy on the canonical filesystem target that will actually be read, not only on the lexical user path.

Appended this note to `memory.md` under the existing higher-risk tool workflow notes.
