# readfile validation — implementation summary

This document records what was implemented from `docs/review-validations/readfile-validation.md` (**Fix now** only).

## Findings implemented

1. **readFile symlink / real-path bypass**
  The handler resolves the user path, then applies `fs.promises.realpath` so blocked-path policy (`.git`, `node_modules`, `.env*`) and the subsequent read use the same canonical path as the bytes that would be read, closing the lexical-only bypass.
2. **readFile pending loading UI**
  Assistant messages can show `FileReadContextSlot` when `readFilePending` is true even if no text part has streamed yet, and that state no longer falls through to `(non-text content)`.
3. **Eval mirror and symlink smoke**
  `evals.mjs` mirrors the route’s `realpath` + policy + read flow. A small readFile eval (`readfile-symlink-git-blocked`) reads a repo fixture symlink (`_ace_readfile_eval_symlink_to_git` → `.git/HEAD`) and expects a denial response consistent with the direct `.git/HEAD` case.

## Files changed


| File                                | Change                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/api/chat/route.ts`             | `realpath` after `path.resolve`, policy on canonical path, `readFile` on canonical path, stable error codes/messages (including `realpath` failure mapping). |
| `app/page.tsx`                      | Message body branch: treat assistant `readFilePending` like displayable content; render markdown only when `m.text` is non-empty.                            |
| `evals.mjs`                         | Same readFile path logic as route; new `readfile-symlink-git-blocked` prompt.                                                                                |
| `_ace_readfile_eval_symlink_to_git` | New symlink in project root (target `.git/HEAD`) for the symlink eval.                                                                                       |


## Behaviour changes

- **readFile tool:** After resolve, the server runs **realpath** first. `ENOENT` from **realpath** returns `**not_found`** (same user-facing line as before for missing paths). `EACCES` / `EPERM` on **realpath** map to `**permission_denied`**. Other realpath errors map to `**read_error`**. Blocked location checks and UTF-8 read use the **canonical** path; success and denial messages for allowed/blocked content are otherwise unchanged in intent.
- **Chat UI:** If the assistant is still waiting on readFile and has no text yet, users see the file-read affordance (e.g. “Reading file…”) instead of `(non-text content)`.
- **Evals:** New automated readFile case for symlink-to-blocked-target; all readFile tool logic in evals stays aligned with the API route for policy tests.

## Findings intentionally not implemented

- **Recommended Action Plan (non–Fix-now) items** treated as deferral or optional in the validation doc (e.g. broader test matrix, threat-model–only notes) were not expanded here.
- **“No action”** items (e.g. treating JSON `validJson: false` from fenced output as a product bug) were not changed.
- **Windows-specific path edge cases** and other deferred portability work are out of scope for this pass.

## Checks / evals to rerun (not run in this task)

- Full project checks as in `docs/checks/readfile-checks.md` (e.g. production `next build` / project `checks.sh` if used).
- `npm run eval:run` to refresh `docs/evals`-style output; confirm `**readfile-symlink-git-blocked`** and existing readFile cases, including after cloning on environments where the symlink fixture or `.git` may differ.

## Notes for review-retro

- **Mirrored policy:** `evals.mjs` and `app/api/chat/route.ts` were updated in the same change; future policy edits should keep both in sync.
- **Symlink fixture:** `_ace_readfile_eval_symlink_to_git` is intentional for the new eval. Clones without `.git` or with symlink restrictions may need a doc note or CI skip; not addressed here.
- **Ordering:** `realpath` can surface missing paths before `readFile`; this matches “fail closed” for policy and is consistent for normal missing files.