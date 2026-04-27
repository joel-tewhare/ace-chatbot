# FEATURE ANCHOR DOC

## Feature summary

Add the third chatbot tool, `fetchUrl`, so the assistant can fetch text content from a URL and use that content in its response.

This feature continues the existing tool-calling work already started with `readFile` and `calculate`. It gives the chatbot another controlled capability: reading public web page text through a server-side tool instead of pretending it knows the page contents.

## User outcome

The user should be able to ask the chatbot to fetch a URL and summarise or answer questions about the page.

Example:

> Fetch https://example.com and summarise what's on the page

The chatbot should call the `fetchUrl` tool, receive the fetched text content, and respond with a concise summary.

## Scope

IN:

- Add a `fetchUrl` tool in `app/api/chat/route.ts`
- Use Vercel AI SDK `tool()` and `jsonSchema`
- Tool accepts a URL string as input
- Tool fetches the URL server-side
- Tool returns text content
- Tool truncates returned content to the first 5000 characters
- Tool handles errors safely and returns user-facing error text instead of crashing
- Add `fetchUrl` to the `tools` object passed to `streamText`
- Keep `stopWhen: stepCountIs(5)` so tool calls can chain
- Add or update eval coverage if appropriate
- Keep behaviour aligned with existing `readFile` and `calculate` tool patterns

OUT:

- No local model setup
- No structured output / Zod work
- No advanced URL crawling
- No multi-page scraping
- No HTML parsing beyond simple text extraction unless already easy and minimal
- No browser rendering
- No authentication or private URL handling
- No UI redesign
- No detailed rendering of `tool-*` parts in `page.tsx`
- No changes to `readFile` or `calculate` unless needed for consistency

## Inputs / dependencies

This feature relies on:

- Existing API route: `app/api/chat/route.ts`
- Existing `streamText()` setup
- Existing tool pattern from `readFile` and `calculate`
- Existing `stopWhen: stepCountIs(5)`
- Existing chatbot UI in `app/page.tsx`
- Native/server `fetch`
- Vercel AI SDK:
  - `tool`
  - `jsonSchema`
  - `stepCountIs`

Possible eval dependency:

- Existing `evals.mjs`
- Existing tool eval pattern from `calculate` and `readFile`

## Rules

For this feature to be correct:

- The model can call `fetchUrl` when the user asks it to fetch or summarise a URL
- The tool requires a URL input
- Invalid or missing URLs should return a safe error response
- Fetch failures should not crash the route
- The tool should return text content, not raw response objects
- Returned content should be truncated to 5000 characters
- The chatbot should summarise the fetched content in its final text response
- The implementation should follow the existing tool style in the route
- The feature should not introduce unnecessary frontend changes
- The feature should not broaden into local model or structured-output work

## Boundaries

This feature can touch:

- `app/api/chat/route.ts`
- `evals.mjs`, if adding tool eval coverage
- Possibly documentation or build summary files if your workflow creates them

This feature should avoid:

- `app/page.tsx`, unless there is a small required change
- Local model setup
- Auth/security changes unrelated to `fetchUrl`
- New UI components
- Large refactors of tool registration
- Changing existing `readFile` / `calculate` behaviour
- Adding real browser scraping or crawler logic

## Output goal

`/plan` should produce a pass-based implementation plan for adding `fetchUrl`.

The plan should cover:

- Where the `fetchUrl` tool belongs in `app/api/chat/route.ts`
- The input schema shape for the tool
- Safe URL validation and error handling
- Fetching and truncating page text
- Adding the tool to `streamText`
- Minimal eval coverage for a successful URL and/or invalid URL case
- Verification prompts to test manually
- Clear pass boundaries:
  - Pass 1: identify route/tool structure only
  - Pass 2: wire `fetchUrl` tool into `streamText`
  - Pass 3: add safe fetch/error/truncation behaviour
  - Pass 4: polish, evals, and verification notes