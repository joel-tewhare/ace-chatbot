# fetchUrl retro — Fix now implementation

This document records what was applied from **Fix now — Workflow Improvements** in `docs/review-retros/fetchurl-retro.md`. No product (application) code was changed.

## Changes applied

1. **Duplicate memory notes in review-retro** — Taught the review-retro skill to prefer **Memory alignment** (reference existing `memory.md` headings/bullets) instead of full append-ready text when the rule already exists. Updated the stale **Candidate memory notes** block in `fetchurl-review-retro.md` accordingly.
2. **Explicit memory outcomes** — Added a required **Memory outcome** block to the review-retro output format, with the two standard lines (*Added new rule(s)* vs *No new entries (merged into existing rules)*), and tied the memory-update instruction to that line when merges occur.
3. **Evidence when checks are not run** — Extended `memory.md` with one bullet on labelling skipped checks/evals next to code-grounded validation. Added an **Evidence** section to `docs/review-implementations/fetchurl-implementation.md`. Extended `/retro` skill inputs so “checks/evals not run” is read as an evidence-strength signal, not a product defect.
4. **Avoid duplicate review-retro execution** — Added a short **Workflow (human)** note to the review-retro skill: do not run `/review-retro` twice in the same closeout when a chained shortcut (e.g. `/ai-retro-closing`) already runs it.

## Files updated


| File                                                     | Role                                                                                                                             |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `~/.codex/skills/review-retro/SKILL.md`                  | Memory alignment bullet, required Memory outcome, merge disclosure in memory-update instruction, workflow note on duplicate runs |
| `~/.cursor/skills/retro/SKILL.md`                        | Input note on implementation summaries that skip checks/evals                                                                    |
| `memory.md`                                              | One new bullet under Build-pro → Eval coverage: safety cases                                                                     |
| `docs/review-retros/fetchurl-review-retro.md`            | Replaced verbatim duplicate candidate bullets with Memory alignment + sample Memory outcome line                                 |
| `docs/review-implementations/fetchurl-implementation.md` | New **Evidence** subsection (code-grounded validation vs checks/evals)                                                           |


## Deduplications performed

- `**fetchurl-review-retro.md`:** The former “append-ready” pair duplicated **Review Triage** and **Build-pro → Tool design: bounded execution over open access** in `memory.md`. That section now only states alignment and a **Memory update: No new entries (merged…)** example—no repeated prose meant for paste into `memory.md`.
- `**memory.md`:** The new evidence-labelling bullet complements the existing “Captured build/eval logs are evidence…” line; it does not restate the fetchUrl policy bullets already under Review Triage / Build-pro.

## Notes for future retro cycles

- When closing a review, end `/review-retro` with **Memory outcome** every time so `/retro` does not re-scan for phantom appends.
- Use **Memory alignment** whenever candidate text would only repeat an existing rule; reserve append-ready bullets for genuinely new nuance.
- For implementation summaries, keep a small **Evidence** (or equivalent) block whenever checks/evals are skipped, so “validated” stays tied to named artefacts, not assumed CI.
- Pick one path for review-retro in a given cycle (manual **or** chained shortcut), not both.