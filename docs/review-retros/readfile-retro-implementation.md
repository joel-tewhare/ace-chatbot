# readfile retro — implementation (Fix now)

This document records what was applied from **Fix now** in `docs/review-retros/readfile-retro.md` (retro closeout for the readfile work). No product code was changed.

## Changes applied

1. `**memory.md` — canonical path rule deduplication**
  Under **Workflow calibration notes**, the higher-risk tools bullet now points to **Filesystem Tool Boundaries** as the single place for read-side path and symlink policy, without restating the full rule (`realpath`, lexical vs canonical, etc.).
2. `**~/.codex/skills/review-retro/SKILL.md`**
  Under **What to do**, added a bullet: if a candidate memory note restates an existing `memory.md` heading or bullet, merge or cross-reference instead of appending a second full version of the same rule. Under **Memory update instruction**, added that candidate notes may be merged or cross-referenced when they duplicate a rule already under a nearby heading.
3. `**~/.cursor/skills/retro/SKILL.md`**
  Under **Inputs to check**, added guidance: when both `docs/review-retros/...-review-retro.md` and post-implementation `memory.md` exist, deduplicate retro recommendations against `memory.md` first; prefer extending existing entries when the concept already exists.
4. `**docs/review-implementations/readfile-implementation.md`**
  Replaced the **Checks / evals to rerun (not run in this task)** section with **Checks / evals (verification)** so pass/fail claims align with `docs/checks/readfile-checks.md` and `docs/evals/readfile-evals.md`, reducing contradiction with review-retro wording (“passed” vs “not run in this task”).

## Files updated


| File                                                     | Role                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `memory.md`                                              | Workflow calibration pointer; full rule remains under **Filesystem Tool Boundaries** |
| `~/.codex/skills/review-retro/SKILL.md`                  | Review-retro skill                                                                   |
| `~/.cursor/skills/retro/SKILL.md`                        | Retro skill                                                                          |
| `docs/review-implementations/readfile-implementation.md` | Implementation summary verification section                                          |
| `docs/review-retros/readfile-retro-implementation.md`    | This file                                                                            |


## Deduplications performed

- **memory.md:** Removed overlap between **Workflow calibration** and **Filesystem Tool Boundaries** by making the workflow line a short cross-reference only (no duplicate policy sentences). The substantive bullets under **Filesystem Tool Boundaries** (canonical target, `readFile`/`path.resolve` drift, `realpath` / `lstat`) are unchanged and remain authoritative.

## Notes for future retro cycles

- When `/review-retro` emits candidate `memory.md` lines, check **Filesystem Tool Boundaries** and **Workflow calibration** (and related headings) first; extend or add a one-line cross-reference when the idea already exists.
- When recording verification after an implementation, point to **one** checks artefact and **one** evals artefact (or a dated run log) so “passed” in review-retro and “source of truth” in implementation docs stay aligned.
- After `/retro`, diff suggested bullets against current `memory.md` before appending, per the updated retro skill.