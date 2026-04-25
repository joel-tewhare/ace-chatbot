import dotenv from 'dotenv'
import { generateText, tool, jsonSchema, stepCountIs } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'

dotenv.config({ path: '.env.local' })

const PROMPTS = [
  'In one sentence, explain what a closure is in JavaScript.',
  'Return valid JSON only: {"topic":"<topic>","bullets":["...","..."]} for "Tailwind utility classes".',
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

const chatTools = {
  calculate: calculateTool,
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
    const parsed = JSON.parse(text)

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

  if (hadFailure) {
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
