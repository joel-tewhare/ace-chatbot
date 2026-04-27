Here’s a concise handoff.

### Delivered

- `**docs/review-retros/readfile-retro.md**` — Full retro: **Keep / Adjust / Remove or simplify / Script candidates / Recommended skill updates / Loop assessment**, plus a short **memory.md change summary** in that file.

### `readfile-review-retro.md` usefulness

- **Useful:** It ranked what mattered (symlink → canonical policy, UI pending state, not treating fenced JSON as readFile), and the lessons match implementation + validation.  
- **Friction:** The **candidate memory line** for canonical path duplicated content already in **Filesystem Tool Boundaries** and **Workflow calibration**; the retro doc calls that out and suggests `/review-retro` **merge or cross-reference** when the rule already exists.

### `memory.md` change (brief)

- Under **Workflow calibration — higher-risk tools**, the bullet that **fully repeated** “enforce access policy on the canonical … lexical path” was **removed**.  
- It was **replaced** with a **single line** that sends readers to **Filesystem Tool Boundaries** for lexical vs canonical / symlinks, so the detailed rule stays in one place (with `realpath` / `lstat` there).

No product code was changed. Recommended **skill** tweaks (review-retro merge rule, retro skill dedup against `memory.md`) are only written into `**readfile-retro.md`** as optional, minimal suggestions—you can apply them in your global skill files when you want.
emory:** The substantive rule (`realpath` / `lstat`, lexical vs bytes read) remains under **Security → Filesystem Tool Boundaries**; workflow calibration now points there instead of repeating the same sentence.

## Adjust

- **review-retro → memory (candidate notes):** The append-ready line about canonical target was **directionally right** but overlapped with existing **Workflow calibration** and **Filesystem Tool Boundaries** bullets. Future `/review-retro` runs should **extend one existing bullet** (or add a one-line cross-reference) when the nuance is already in `memory.md`, per the review-retro skill’s “avoid adding notes already clearly present.”
- **Implementation doc “Checks / evals to rerun”:** The implementation summary listed checks/evals as “not run in this task” while the review-retro claimed full pass—acceptable as a time snapshot, but for handoff clarity a single line like “Verification: see `readfile-checks` / `readfile-evals` artefact date” would reduce apparent contradiction between docs.

## Remove or simplify

- **No skill text removed:** No change proposed to full skill files; only small additions below.
- **memory.md:** Removed duplicate standalone sentence on canonical path under **Workflow calibration**; kept **Filesystem Tool Boundaries** as the one place for mechanism (`realpath`, symlinks, lexical drift). Other bullets (eval mirror, tool parts before text) were left as they cover different aspects.

## Script candidates (light)

- **None** from this pass. Symlink eval + fixture is already the reproducible check; CI clone/symlink edge cases are environment-specific, not a one-liner script.

## Recommended skill / process updates

These are **minimal, optional** wording nudges. No full rewrites.


| File                                                                             | Change                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `~/.codex/skills/review-retro/SKILL.md` (under *What to do* or *What not to do*) | Add one bullet: *If a candidate memory note restates an existing `memory.md` heading (e.g. security vs workflow), **merge or cross-reference** instead of appending a second full version of the same rule.*                             |
| `~/.cursor/skills/retro/SKILL.md` (Inputs to check)                              | Add: *If both `docs/review-retros/...-review-retro.md` and post-implementation `memory.md` exist, **deduplicate** retro recommendations against `memory.md` before suggesting new bullets.*                                              |
| Process loop (human-facing)                                                      | After implementation, when recording verification, **one** checks artefact and **one** evals artefact (or a single “verified” line in implementation doc) keeps review-retro and implementation summaries aligned on “all green” claims. |


## Loop assessment

- The chain **review → validation → implement → checks/evals → review-retro** worked: the two substantive findings were fixed and the noise (JSON eval) was filtered.
- The only process friction this retro found was **memory duplication** from the review-retro candidate and pre-existing Security/Workflow text—addressed in `memory.md` by **reference, not a third copy** of the canonical-path rule.
- No change recommended to build/plan/review or project-review skills beyond the small review-retro/retro nudges above.

## memory.md change summary

- **Workflow calibration — higher-risk tools:** Dropped the standalone bullet that repeated “enforce policy on canonical target…” in full; replaced with a **pointer** to **Filesystem Tool Boundaries** for lexical vs canonical path and symlinks, so the rule lives in one place with the `realpath` / `lstat` context.