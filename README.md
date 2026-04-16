# ACE Chatbot — JS Challenge

Build a multi-provider chatbot with Next.js and Vercel AI SDK v6. This folder is your starting point — dependencies and config are set up, you just need to write the code.

## Quick start

```bash
npm install
cp .env.example .env.local   # then add your API keys
npm run dev
```

Opens at http://localhost:3000 with a placeholder page.

## What to build

Follow the tutorial lesson to build each piece:

### Step 1: Chat API route
- Edit `app/api/chat/route.ts`
- Import `streamText` and `convertToModelMessages` from `ai`
- Import `google` from `@ai-sdk/google`
- Call Gemini, return `result.toUIMessageStreamResponse()`

### Step 2: Chat UI
- Edit `app/page.tsx`
- Import `useChat` from `@ai-sdk/react` and `useState` from React
- Manage your own input state (v6 doesn't provide `input`/`handleInputChange`)
- Call `sendMessage({ text: input })` to send messages
- Render messages using `message.parts` (not `message.content`)

### Step 3: Multi-provider
- Add a model selector dropdown with `useState`
- Pass the selected model to the API route — the `body` goes in the **second argument**:
  ```typescript
  sendMessage({ text: input }, { body: { model } });
  ```
- In the route, read the model from the request body and switch providers
- Add Claude and GPT providers to the route (`npm install @ai-sdk/anthropic @ai-sdk/openai`)

### Step 4: Evals
- Create `evals.mjs` with 3 evaluation functions (on-topic, valid JSON, concise)
- Use `import dotenv from 'dotenv'; dotenv.config({ path: '.env.local' });` to load your keys
- Use `generateText` from `ai` with your provider imports to get responses
- Run against at least 2 providers and compare results
- Run with `node evals.mjs`

## Stuck?

Look at `../sample-solution/` for a complete working version.

## API keys

You need at least `GOOGLE_GENERATIVE_AI_API_KEY` in your `.env.local` for the default Gemini provider.

Note: the Vercel AI SDK uses `GOOGLE_GENERATIVE_AI_API_KEY`, not `GOOGLE_API_KEY`.
