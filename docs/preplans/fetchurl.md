Feature:
fetchUrl (chat URL fetch)

Goal:
The user can ask the chatbot to load a public web page by URL and receive a concise summary or answers grounded in the page text, with the assistant using a controlled fetch step instead of inventing page content.

UI shape:
The experience remains the existing single-thread chat: the user types; the assistant replies. There is no new layout or screen. Tool use may occur in the background like other chat tools, without a dedicated visual treatment for this release.

User flow:

- The user sends a message asking to fetch a URL and summarise the page or answer questions about it (URL may appear in the message).
- The assistant uses the fetch capability with that URL, receives extracted text or a clear error, and composes a normal chat reply.
- The user reads the reply and may continue the conversation.

Context:

- Third chat tool alongside existing read-file and calculate-style capabilities.
- Server-side fetch of public URLs; the model should not pretend to know page contents without fetching.
- Behaviour should stay aligned with existing tool patterns and step limits; no chat UI redesign.

Scope:

- Included: A new tool that takes a URL, fetches page text server-side, returns plain text truncated to the first 5,000 characters, surfaces safe user-facing errors for invalid URLs and fetch failures, and participates in the same multi-step tool flow as existing tools.
- Excluded: Local model setup, structured or schema-based output work, multi-page crawling, authenticated or private URLs, browser rendering, heavy HTML parsing beyond simple text extraction unless trivial, new chat UI or detailed tool-part rendering, and changes to other tools except minimal consistency needs.

Important behaviour:

- URL input is required; invalid or missing URLs produce safe, readable error text rather than crashing the chat path.
- Successful results return text content only (not raw response payloads), capped at 5,000 characters.
- Network and HTTP failures are handled gracefully with user-facing error messaging.
- The assistant’s visible reply should summarise or use the fetched text like other tool-fed context.
- Tool chaining and step limits match the existing chat tool setup.

Open assumptions:
None

Design.md (if generated):
<<>>
Not generated
<<>>

Draft /plan prompt:
Add a fetchUrl capability to the existing chat assistant so users can ask to load a public URL and summarise or answer questions about the page. The assistant should call fetchUrl with the URL, receive up to 5,000 characters of extracted text or a safe error string, and answer in normal chat prose. Register and style it like the project’s existing chat tools, preserve the same multi-step tool budget, and avoid new chat UI or behavioural changes to other tools except what consistency requires. Out of scope: crawling, auth or private URLs, browser rendering, structured output, local models, and non-minimal HTML parsing. Deliver pass-based plan boundaries: map where the tool lives and how tools are registered; wire fetchUrl into the assistant; implement safe URL handling, fetch, truncation, and errors; then polish, minimal automated checks for a good URL and a bad or failing URL, and short manual verification prompts.