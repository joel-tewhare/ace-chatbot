# Feature: readFile Tool

## Context

The chatbot needs the ability to read local files when the user explicitly asks for file contents or analysis.

This extends the system from:
- pure reasoning → 
- reasoning + local data access

This introduces a **new trust boundary** because the model can now request access to the file system.

---

## Scope

### In scope
- Read a file from a provided path
- Return file contents as text
- Basic error handling (file not found, unreadable file)
- Model decides when to call the tool

### Out of scope
- Directory browsing / listing files
- Writing or modifying files
- Large file streaming or chunking
- Access control or sandboxing (deferred for later)
- Binary file handling

---

## Tool Contract

### Name
`readFile`

### Input shape
```ts
{
  path: string
}