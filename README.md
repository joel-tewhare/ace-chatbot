# ace-chatbot

A multi-provider AI chatbot built with Next.js and the Vercel AI SDK.  
It supports Gemini, GPT, and Claude models with a simple model selector and focuses on improving output quality through lightweight evaluation checks and an agentic coding workflow.

---

## Features

- Streaming chat UI using `useChat` and server-side `streamText`
- Model selector to switch between providers
- Multi-provider support (Gemini, OpenAI, Anthropic)
- Conversation history
- Error-aware UX (preserves input and shows feedback on failure)
- Evaluation script for:
  - On-topic responses
  - JSON validity (schema-aware)
  - Conciseness

---

## Agentic Workflow

This project was built using a structured agentic workflow:

- Pass-based development (UI → Data → Logic → Polish)
- External AI code review
- Review-retro loop to filter and apply improvements
- Memory-driven updates (`memory.md`) to capture reusable patterns

---

## Notes

- Gemini was used for live testing
- OpenAI and Anthropic are fully wired and ready with API keys

---

## Setup

```bash
npm install
npm run dev
```

Create a .env.local file:

GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

Then open:
http://localhost:3000

## Developer Notes

See `README.dev.md` for detailed development notes and course-related context.
