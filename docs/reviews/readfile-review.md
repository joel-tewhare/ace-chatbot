**Findings**

- **High | readFile access policy | [app/api/chat/route.ts](/Users/joeltewhare/Documents/Course - ACE with JV/tutorials/js/challenge/app/api/chat/route.ts:186)**
The blocked-path checks run on the lexical resolved path before the filesystem read, but `readFileFromFs` follows symlinks. A symlink inside the project with a harmless name can point to `.git/HEAD`, `.env.local`, `node_modules`, or another sensitive readable text file and bypass the `.git` / `node_modules` / `.env`* checks.
Why it matters: the eval proves direct `.git/HEAD` access is blocked, but the actual policy can still be bypassed through filesystem indirection.
Minimal suggestion: resolve the real target path with `realpath` before applying blocked-location checks, and add an eval/check for a symlink to a blocked file. If symlinks should not be supported, reject them via `lstat`.
- **Low | readFile loading UI | [app/page.tsx*](/Users/joeltewhare/Documents/Course - ACE with JV/tutorials/js/challenge/app/page.tsx:261)*
`FileReadContextSlot` only renders inside the `m.text ? ... : ...` branch. A readFile tool part can be pending before assistant text exists, which means the message shows `(non-text content)` instead of the intended `Reading file...` affordance.
Why it matters: it weakens the Pass 2/4 loading behaviour, though the generic `Thinking...` row still covers basic progress.
Minimal suggestion: render `FileReadContextSlot` for assistant messages before the text/non-text branch, or treat `readFilePending` as displayable content.

**Eval / Checks Notes**

The deterministic checks artefact passes production build: [docs/checks/readfile-checks.md](/Users/joeltewhare/Documents/Course - ACE with JV/tutorials/js/challenge/docs/checks/readfile-checks.md:15).

The eval JSON failure is unrelated to readFile: the model wrapped otherwise valid JSON in a fenced block, so `validJson: false` is expected for that general eval and not a readfile product bug: [docs/evals/readfile-evals.md](/Users/joeltewhare/Documents/Course - ACE with JV/tutorials/js/challenge/docs/evals/readfile-evals.md:13).

The readfile evals pass for package read, missing file, and direct `.git/HEAD` denial. They do not cover the symlink bypass above, and because `evals.mjs` mirrors the route logic, it would currently reproduce the same gap: [evals.mjs](/Users/joeltewhare/Documents/Course - ACE with JV/tutorials/js/challenge/evals.mjs:154).

**Summary**

Overall quality is solid for the conversational tool loop and error contract. The main risk is the filesystem policy being enforceable only for direct paths, not real targets. Confidence: high.