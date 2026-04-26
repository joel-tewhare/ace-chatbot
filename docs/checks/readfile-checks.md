Running full project checks...

=== Deterministic code checks ===

→ Production build

> [ace-chatbot@0.1.0](mailto:ace-chatbot@0.1.0) build
> next build

▲ Next.js 16.2.4 (Turbopack)

- Environments: .env.local
Creating an optimized production build ...

✓ Compiled successfully in 1569ms
  Running TypeScript ...
  Finished TypeScript in 1081ms ...
  Collecting page data using 5 workers ...
  Generating static pages using 5 workers (0/4) ...
  Generating static pages using 5 workers (1/4) 
  Generating static pages using 5 workers (2/4) 
  Generating static pages using 5 workers (3/4) 
✓ Generating static pages using 5 workers (4/4) in 214ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
└ ƒ /api/chat

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

=== Manual verification reminders ===

→ Auth / API reminder
  After auth, SDK, or API client changes, confirm request headers,
  tokens, cookies, or request options are still attached through the
  current supported path.

→ Chat flow reminder
  Confirm the intended request and response flow still works in the UI
  after changes to chat hooks, route handlers, or provider wiring.

→ Optional eval script
  After model or prompt changes, you can run: npm run eval:run
  (not part of this script; may call external APIs and use env keys).

=== LLM output evaluation reminders ===

Check recent outputs against these questions:

1. On-topic
  - Does the response actually answer the user's question?
2. Valid JSON
  - If JSON was requested, is the output parseable and shaped as expected?
3. Concise
  - If brevity was requested, does the response stay within the intended
   word, sentence, or structure limit?

✅ Full checks passed