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
  const keywords = p.includes('closure')
    ? ['closure', 'function']
    : ['tailwind', 'utility']
  return keywords.some((k) => t.includes(k))
}

function evalValidJson(prompt, text) {
  if (!prompt.toLowerCase().includes('json')) return true
  try {
    JSON.parse(text)
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
