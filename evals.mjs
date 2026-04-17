import dotenv from 'dotenv'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'

dotenv.config({ path: '.env.local' })

const PROMPTS = [
  'In one sentence, explain what a closure is in JavaScript.',
  'Return valid JSON only: {"topic":"<topic>","bullets":["...","..."]} for "Tailwind utility classes".',
]

function evalOnTopic(prompt, text) {
  const p = prompt.toLowerCase()
  const t = (text ?? '').toLowerCase()
  if (p.includes('closure')) {
    // Require the core concept (closure) plus at least one supporting concept.
    const hasClosure = t.includes('closure')
    const supporting = ['scope', 'lexical', 'enclose', 'outer', 'variable']
    return hasClosure && supporting.some((k) => t.includes(k))
  }

  if (p.includes('tailwind') && p.includes('json')) {
    // Require explicit Tailwind reference plus at least one indicator of utilities/classes.
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

    // Schema-aware check for this challenge prompt.
    // Expect: { topic: string, bullets: string[] (len>=2) }
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

async function runOne(model, prompt) {
  const result = await generateText({
    model,
    prompt,
  })
  return result.text ?? ''
}

async function main() {
  const providers = [
    { name: 'gemini-2.5-flash', model: google('gemini-2.5-flash') },
    { name: 'gpt-4.1', model: openai('gpt-4.1') },
    {
      name: 'claude-sonnet-4-20250514',
      model: anthropic('claude-sonnet-4-20250514'),
    },
  ]

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

      console.log(`-- ${p.name} --`)
      console.log(text.trim())
      console.log('checks:', checks)
      console.log('')
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
