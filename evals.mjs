import { readFile as readFileFromFs, realpath as realpathFromFs } from 'node:fs/promises'
import * as nodePath from 'node:path'
import dotenv from 'dotenv'
import { runFetchUrlTool } from './lib/fetchurl.mjs'
import { generateText, tool, jsonSchema, stepCountIs } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'

dotenv.config({ path: '.env.local' })

const PROMPTS = [
  'In one sentence, explain what a closure is in JavaScript.',
  'Return valid JSON only: {"topic":"<topic>","bullets":["...","..."]} for "Tailwind utility classes". Use exactly two bullets.',
]

const TOOL_PROMPTS = [
  {
    id: 'calc-basic',
    prompt: 'What is 847 * 293 + 15?',
    expectedText: '248186',
  },
  {
    id: 'calc-percent',
    prompt: 'What is 15% of 320?',
    expectedText: '48',
  },
  {
    id: 'calc-invalid-reference',
    prompt: 'Calculate foo + 1',
    // Flexible: model may paraphrase tool errors; any substring match passes.
    expectedAny: [
      'Could not evaluate',
      'undefined name',
      'only numbers',
      'cannot calculate',
      'not a number',
      'valid numerical expression',
      'valid mathematical expression',
    ],
  },
]

const READFILE_TOOL_PROMPTS = [
  {
    id: 'readfile-package-name',
    prompt:
      'Read package.json in this project and answer: what is the value of the "name" field? Reply in one short sentence that includes the exact name string.',
    expectedText: 'ace-chatbot',
  },
  {
    id: 'readfile-missing',
    prompt:
      'Read the file z_nonexistent_ace_eval_99999.txt in the project root and quote its first line.',
    expectedAny: [
      'not found',
      'no file was found',
      "couldn't",
      "can't",
      'does not exist',
      'missing',
    ],
  },
  {
    id: 'readfile-git-blocked',
    prompt: 'Read and display the full contents of the file at .git/HEAD in this project.',
    expectedAny: [
      "can't be read",
      "can't be read from this app",
      'blocked',
      'access',
      'denied',
      'not read',
      "can't read",
    ],
  },
  {
    id: 'readfile-symlink-git-blocked',
    prompt:
      'Read the file _ace_readfile_eval_symlink_to_git in the project root and show its first line or contents.',
    expectedAny: [
      "can't be read",
      "can't be read from this app",
      'blocked',
      'access',
      'denied',
      'not read',
      "can't read",
    ],
  },
]

const FETCHURL_TOOL_PROMPTS = [
  {
    id: 'fetchurl-example',
    prompt:
      'Use the fetch tool to load https://example.com and say in one short sentence what the main title or heading of the page is (e.g. “Example Domain”).',
    expectedAny: [
      'Example Domain',
      'example.com',
    ],
  },
  {
    id: 'fetchurl-invalid',
    prompt:
      'Use the fetch tool with the URL "not a url" and then explain in one sentence that the tool could not load the page.',
    expectedAny: [
      'not valid',
      'not valid for fetching',
      'Invalid',
      'missing',
      'could not',
      "couldn't",
      'could not be loaded',
      'unable',
    ],
  },
]

function calculateToolError(message) {
  return `Could not evaluate: ${message}`
}

function evaluateMathExpressionTutorial(expression) {
  const trimmed = expression.trim()
  if (!trimmed) {
    throw new Error('Expression is empty.')
  }

  let run
  try {
    run = new Function(`return (${trimmed})`)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid expression syntax.')
    }
    throw error
  }

  try {
    return run()
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid expression syntax.')
    }

    if (error instanceof ReferenceError) {
      throw new Error(
        'Expression references an undefined name; use only numbers and arithmetic operators.',
      )
    }

    if (error instanceof RangeError) {
      throw new Error(error.message || 'Numeric overflow or out-of-range result.')
    }

    throw error
  }
}

/** Stable readFile failure categories — match `app/api/chat/route.ts`. */
const READ_FILE_USER_MESSAGES = {
  invalid_input: 'The file path is missing or invalid.',
  access_denied: "That path can't be read from this app (e.g. blocked locations).",
  not_found: 'No file was found at that path.',
  not_readable: "That isn't a plain text file here, or it isn't a file path.",
  permission_denied: 'Permission to read that file was denied.',
  read_error: "The file couldn't be read due to an error.",
}

// This `readFile` tool mirrors `app/api/chat/route.ts` for eval-only runs. Keep both
// in sync if you change tool description, input schema, or execute behaviour.
const readFileTool = tool({
  description:
    'Read a local text file when the user asks to see or analyze file contents. The model supplies the path (relative to the server working directory or absolute); the read runs in this app process, not a user-handled file picker. Returns a JSON object: { ok: true, content: string } on success (content may be "" for an empty file—do not say the file is missing). On failure returns { ok: false, code: string, message: string } with a short user-facing message; explain that failure using message and do not pretend the file was read. Do not use for directory listing, writes, or non-text files.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description:
          'Path to a single file to read as UTF-8 text. Relative paths resolve from the server working directory.',
      },
    },
    required: ['path'],
    additionalProperties: false,
  }),
  execute: async ({ path: filePath }) => {
    if (
      filePath == null ||
      typeof filePath !== 'string' ||
      filePath.trim().length === 0
    ) {
      return { ok: false, code: 'invalid_input', message: READ_FILE_USER_MESSAGES.invalid_input }
    }
    const resolved = nodePath.resolve(process.cwd(), filePath)
    let canonical
    try {
      canonical = await realpathFromFs(resolved)
    } catch (error) {
      const err = error
      if (err && typeof err === 'object' && 'code' in err) {
        const code = err.code
        if (code === 'ENOENT') {
          return { ok: false, code: 'not_found', message: READ_FILE_USER_MESSAGES.not_found }
        }
        if (code === 'EACCES' || code === 'EPERM') {
          return {
            ok: false,
            code: 'permission_denied',
            message: READ_FILE_USER_MESSAGES.permission_denied,
          }
        }
      }
      return { ok: false, code: 'read_error', message: READ_FILE_USER_MESSAGES.read_error }
    }
    const rel = nodePath.relative(process.cwd(), canonical)
    for (const part of rel.split(nodePath.sep)) {
      if (part === '.git' || part === 'node_modules') {
        return { ok: false, code: 'access_denied', message: READ_FILE_USER_MESSAGES.access_denied }
      }
    }
    const base = nodePath.basename(canonical)
    if (base === '.env' || base.startsWith('.env.')) {
      return { ok: false, code: 'access_denied', message: READ_FILE_USER_MESSAGES.access_denied }
    }
    try {
      const content = await readFileFromFs(canonical, { encoding: 'utf8' })
      if (content.includes('\0')) {
        return { ok: false, code: 'not_readable', message: READ_FILE_USER_MESSAGES.not_readable }
      }
      return { ok: true, content }
    } catch (error) {
      const err = error
      if (err && typeof err === 'object' && 'code' in err) {
        const code = err.code
        if (code === 'ENOENT') {
          return { ok: false, code: 'not_found', message: READ_FILE_USER_MESSAGES.not_found }
        }
        if (code === 'EISDIR' || code === 'ENOTDIR') {
          return { ok: false, code: 'not_readable', message: READ_FILE_USER_MESSAGES.not_readable }
        }
        if (code === 'EACCES' || code === 'EPERM') {
          return {
            ok: false,
            code: 'permission_denied',
            message: READ_FILE_USER_MESSAGES.permission_denied,
          }
        }
      }
      return { ok: false, code: 'read_error', message: READ_FILE_USER_MESSAGES.read_error }
    }
  },
})

// This `calculate` tool mirrors `app/api/chat/route.ts` for eval-only runs. Keep both
// in sync if you change tool description, input schema, or execute behaviour.
const calculateTool = tool({
  description:
    'Evaluate one mathematical expression and return the result. Use only for math or numeric calculations. If the user asks for a percentage, rewrite it first, for example "15% of 320" becomes "0.15 * 320". Do not use for non-math requests.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description:
          'A single arithmetic expression using numbers, +, -, *, /, and parentheses.',
      },
    },
    required: ['expression'],
    additionalProperties: false,
  }),
  execute: async ({ expression }) => {
    try {
      if (expression === undefined || expression === null) {
        return calculateToolError('missing expression.')
      }

      if (typeof expression !== 'string') {
        return calculateToolError('expression must be a string.')
      }

      const value = evaluateMathExpressionTutorial(expression)

      if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
          return calculateToolError(
            'result is not a finite number, for example division by zero or overflow.',
          )
        }

        return String(value)
      }

      if (typeof value === 'bigint') {
        return String(value)
      }

      return calculateToolError(`expected a numeric result, got ${typeof value}.`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error during evaluation.'
      return calculateToolError(message)
    }
  },
})

// This `fetchUrl` tool mirrors `app/api/chat/route.ts` and `lib/fetchurl.mjs`. Keep in sync
// if you change tool description, input schema, or execute behaviour.
const fetchUrlTool = tool({
  description:
    'Fetch a public web page and return a plain-text excerpt when the user asks to read, summarize, or answer questions about a URL. The model supplies a single absolute http(s) URL. Returns { ok: true, text: string } with the first 5,000 characters of extractable text on success, or { ok: false, code, message } with a short user-facing error—explain failures with message; do not invent page content. Do not use for file://, local networks, or authenticated or private resources.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'A single public http or https URL to fetch with GET (no auth).',
      },
    },
    required: ['url'],
    additionalProperties: false,
  }),
  execute: async ({ url }) => runFetchUrlTool({ url }),
})

const chatTools = {
  calculate: calculateTool,
  readFile: readFileTool,
  fetchUrl: fetchUrlTool,
}

function evalOnTopic(prompt, text) {
  const p = prompt.toLowerCase()
  const t = (text ?? '').toLowerCase()

  if (p.includes('closure')) {
    const hasClosure = t.includes('closure')
    const supporting = ['scope', 'lexical', 'enclose', 'outer', 'variable']
    return hasClosure && supporting.some((k) => t.includes(k))
  }

  if (p.includes('tailwind') && p.includes('json')) {
    const hasTailwind = t.includes('tailwind')
    const supporting = ['utility', 'class', 'classes', 'css']
    return hasTailwind && supporting.some((k) => t.includes(k))
  }

  return true
}

function evalValidJson(prompt, text) {
  if (!prompt.toLowerCase().includes('json')) return true

  try {
    const parsed = JSON.parse(text.trim())

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed) ||
      typeof parsed.topic !== 'string' ||
      parsed.topic.trim().length === 0 ||
      !Array.isArray(parsed.bullets) ||
      parsed.bullets.length < 2 ||
      !parsed.bullets.every((b) => typeof b === 'string' && b.trim().length > 0)
    ) {
      return false
    }

    return true
  } catch {
    return false
  }
}

function evalConcise(_prompt, text) {
  return (text ?? '').trim().length <= 400
}

function stripCommas(s) {
  return (s ?? '').replaceAll(',', '')
}

function evalIncludes(text, expectedText) {
  const t = text ?? ''
  if (t.includes(expectedText)) return true
  return stripCommas(t).includes(stripCommas(expectedText))
}

function evalIncludesAny(text, expectedOptions) {
  const lowerText = (text ?? '').toLowerCase()
  return expectedOptions.some((option) => lowerText.includes(option.toLowerCase()))
}

async function runOne(model, prompt) {
  const result = await generateText({
    model,
    prompt,
  })

  return result.text ?? ''
}

async function runOneWithTools(model, prompt) {
  const result = await generateText({
    model,
    prompt,
    tools: chatTools,
    stopWhen: stepCountIs(5),
  })

  return result.text ?? ''
}

async function main() {
  const providers = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY && {
      name: 'gemini-2.5-flash',
      model: google('gemini-2.5-flash'),
    },
    process.env.OPENAI_API_KEY && {
      name: 'gpt-4.1',
      model: openai('gpt-4.1'),
    },
    process.env.ANTHROPIC_API_KEY && {
      name: 'claude-sonnet-4-20250514',
      model: anthropic('claude-sonnet-4-20250514'),
    },
  ].filter(Boolean)

  if (providers.length === 0) {
    console.warn(
      'evals.mjs: No providers configured. Set one or more of: GOOGLE_GENERATIVE_AI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY',
    )
    return
  }

  let hadFailure = false

  for (const prompt of PROMPTS) {
    console.log('\n=== Prompt ===\n' + prompt + '\n')

    for (const p of providers) {
      let text = ''
      let error = null

      try {
        text = await runOne(p.model, prompt)
      } catch (e) {
        error = e instanceof Error ? e.message : String(e)
      }

      if (error) {
        console.log(`-- ${p.name}: ERROR --\n${error}\n`)
        continue
      }

      const checks = {
        onTopic: evalOnTopic(prompt, text),
        validJson: evalValidJson(prompt, text),
        concise: evalConcise(prompt, text),
      }

      if (Object.values(checks).some((ok) => !ok)) {
        hadFailure = true
      }

      console.log(`-- ${p.name} --`)
      console.log(text.trim())
      console.log('checks:', checks)
      console.log('')
    }
  }

  for (const test of TOOL_PROMPTS) {
    console.log(`\n=== Tool Prompt: ${test.id} ===\n${test.prompt}\n`)

    for (const p of providers) {
      let text = ''
      let error = null

      try {
        text = await runOneWithTools(p.model, test.prompt)
      } catch (e) {
        error = e instanceof Error ? e.message : String(e)
      }

      if (error) {
        console.log(`-- ${p.name}: ERROR --\n${error}\n`)
        continue
      }

      const checks = {
        includesExpected: test.expectedText
          ? evalIncludes(text, test.expectedText)
          : evalIncludesAny(text, test.expectedAny),
        concise: evalConcise(test.prompt, text),
      }

      if (Object.values(checks).some((ok) => !ok)) {
        hadFailure = true
      }

      console.log(`-- ${p.name} --`)
      console.log(text.trim())
      console.log('checks:', checks)
      console.log('')
    }
  }

  for (const test of READFILE_TOOL_PROMPTS) {
    console.log(`\n=== readFile tool: ${test.id} ===\n${test.prompt}\n`)

    for (const p of providers) {
      let text = ''
      let error = null

      try {
        text = await runOneWithTools(p.model, test.prompt)
      } catch (e) {
        error = e instanceof Error ? e.message : String(e)
      }

      if (error) {
        console.log(`-- ${p.name}: ERROR --\n${error}\n`)
        continue
      }

      const checks = {
        includesExpected: test.expectedText
          ? evalIncludes(text, test.expectedText)
          : evalIncludesAny(text, test.expectedAny),
        concise: evalConcise(test.prompt, text),
      }

      if (Object.values(checks).some((ok) => !ok)) {
        hadFailure = true
      }

      console.log(`-- ${p.name} --`)
      console.log(text.trim())
      console.log('checks:', checks)
      console.log('')
    }
  }

  for (const test of FETCHURL_TOOL_PROMPTS) {
    console.log(`\n=== fetchUrl tool: ${test.id} ===\n${test.prompt}\n`)

    for (const p of providers) {
      let text = ''
      let error = null

      try {
        text = await runOneWithTools(p.model, test.prompt)
      } catch (e) {
        error = e instanceof Error ? e.message : String(e)
      }

      if (error) {
        console.log(`-- ${p.name}: ERROR --\n${error}\n`)
        continue
      }

      const checks = {
        includesExpected: test.expectedText
          ? evalIncludes(text, test.expectedText)
          : evalIncludesAny(text, test.expectedAny),
        concise: evalConcise(test.prompt, text),
      }

      if (Object.values(checks).some((ok) => !ok)) {
        hadFailure = true
      }

      console.log(`-- ${p.name} --`)
      console.log(text.trim())
      console.log('checks:', checks)
      console.log('')
    }
  }

  if (hadFailure) {
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
