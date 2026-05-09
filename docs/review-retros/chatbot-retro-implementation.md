# Chatbot retro — implementation closeout

This document records what was applied from `docs/review-retros/chatbot-retro.md` **Fix now** (and the **Recommended skill updates** those items reference). No product (application) code was changed. Checks and evals were not run per request.

## Changes applied

1. **`~/.codex/skills/review-retro/SKILL.md` — Inputs**  
   - Added one bullet under “You may be given:” requiring explicit mention in **Review retro summary** when implementation / validation / review artefact paths are missing from disk, so `/retro` does not assume a closed loop.

2. **`~/.cursor/skills/retro/SKILL.md` — Inputs to check**  
   - Extended item 2 with guidance to note **artefact gap** when referenced implementation or validation files are missing, and to prefer extending existing **Checks/evals vs revision** guidance in `memory.md` instead of inventing product lessons.

3. **`docs/review-retros/chatbot-retro.md` (workflow artefact only)**  
   - Restored the **Keep** heading and bullet (file had a truncated line: `ion and conflicting snapshots…`).  
   - Replaced the stale “no edits under `~/.codex` or `~/.cursor`” line with a pointer to this implementation doc.  
   - Added **`## Fix now`** so the artefact matches other retro closeouts and lists the immediate actions explicitly.

## Files updated

| File | Change |
|------|--------|
| `~/.codex/skills/review-retro/SKILL.md` | Inputs bullet (missing artefact paths) |
| `~/.cursor/skills/retro/SKILL.md` | Item 2 extension (artefact gap + memory extension) |
| `docs/review-retros/chatbot-retro.md` | **Keep** repair; skill/process line; **Fix now** section |
| `docs/review-retros/chatbot-retro-implementation.md` | This closeout (created) |

## `memory.md`

- **No edit.** The **Fix now** memory check is already satisfied: under **Build-pro, checks, and evals — post-implementation notes → Eval coverage: safety cases**, the “Captured build/eval logs…” bullet already ties snapshot logs to a revision (git SHA or dated note) when proving a specific fix or closing an accept/reject chain.

## Deduplications performed

- **memory.md:** None required; no new bullets were added alongside the existing eval/revision guidance.
- **Skills:** New text complements existing review-retro rules on verification timing and conflicting artefacts (lines 46–48, 114–115) and existing retro guidance on **Checks/evals vs revision**; it does not duplicate those blocks.

## Notes for future retro cycles

- Keep **`## Fix now`** in retro artefacts when handing off to implementation, so scope is obvious (this section was added to `chatbot-retro.md` during this closeout).
- **Adjust** and **Script candidates (light)** items in `chatbot-retro.md` were intentionally left unimplemented here to stay within Fix now.
