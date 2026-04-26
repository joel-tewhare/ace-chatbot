Feature:
readFile tool for the chatbot

Goal:
When the user explicitly asks to see file contents or have them analyzed, the assistant can read a text file at a path the user provides and use that content in its reply, extending the system from pure reasoning to reasoning with local data access, with awareness that this is a new trust boundary between the model and the file system.

UI shape:
The experience stays conversational: the user types requests in the chat, and the assistant may invoke a `readFile` capability when appropriate. The user does not get a separate file-picker UI in this first version; interaction is through natural language and the path supplied for the read operation.

User flow:

- The user asks the assistant to read, show, or analyze a file (explicit request for file contents or analysis).
- The model decides whether to call the `readFile` tool and supplies a `path` string.
- The tool returns the file as text, or a clear error (not found, unreadable); the assistant incorporates the result in its response.

Context:

- The chatbot needs the ability to read local files when the user explicitly asks for file contents or analysis.
- The system moves from pure reasoning to reasoning plus local data access.
- This introduces a new trust boundary because the model can request access to the file system.

Scope:

- Included: a `readFile` tool name; input `{ path: string }`; read file at that path; return contents as text; basic error handling for file not found and unreadable file; the model decides when to call the tool.
- Excluded for now: directory browsing or listing files; writing or modifying files; large-file streaming or chunking; access control or sandboxing; binary file handling.

Important behaviour:

- The model chooses when to invoke the tool, aligned with the user’s explicit need for file contents or analysis.
- Output is text; binary files are not handled in this version.
- Errors are surfaced in a simple, user-meaningful way (missing file, cannot read) without over-building recovery flows in v1.
- There is no listing of directories, no mutating file operations, and no chunked streaming for large files in this version.

Open assumptions:
None

Design.md (if generated):
<<>>
Not generated
<<>>

Draft /plan prompt:
Add a `readFile` tool to the chatbot. When the user explicitly asks for file contents or for a local file to be analyzed, the model may call `readFile` with a `path` string, receive the file as text, and use it in the reply. Scope is read-only, single file at a time, text only; return plain errors when the file is missing or cannot be read. No directory listing, no writes, no streaming for huge files, no access-control or sandboxing work in this first version. The chat stays conversational—no separate file browser UI. The model decides when the tool fits the user’s request. Acknowledge the new trust boundary of filesystem read access in the product (e.g. how you frame risk to the user) only insofar as needed for a minimal first release.