/**
 * Local multi-provider eval: same prompts, ≥2 providers, three checks
 * (on-topic, valid JSON when expected, concise per test case).
 *
 * No live calls / no scoring: use RUN_LOCAL_EVAL_MOCK=1 for layout-only dry run.
 */
import dotenv from 'dotenv'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'

dotenv.config({ path: '.env.local' })

const MOCK = process.env.RUN_LOCAL_EVAL_MOCK === '1'

/** @typedef {{ id: string, prompt: string, maxWords: number, expectsJson: boolean, onTopicKeywords: string[] }} TestCase */

/** @type {TestCase[]} */
const TEST_CASES = [
  {
    id: 'tc-1-tahiti-staple',
    prompt:
      'What is one staple ingredient in many Tahitian dishes? Answer in one short sentence.',
    maxWords: 45,
    expectsJson: false,
    onTopicKeywords: [
      'coconut',
      'fish',
      'tuna',
      'seafood',
      'taro',
      'poisson',
      'fafa',
      'tahiti',
      'tahitian',
    ],
  },
  {
    id: 'tc-2-json-dishes',
    prompt:
      'Return only a JSON object (no markdown, no other text) with key "dishes" whose value is a string array of exactly two example dish names.',
    maxWords: 80,
    expectsJson: true,
    onTopicKeywords: ['dishes'],
  },
]

//Only Gemini provider wired currently
const PROVIDER_CONFIG = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
]

// --- Output (Pass 1 layout) -------------------------------------------------

function printHeader(providerLabels, caseCount) {
  console.log('')
  console.log('══════════════════════════════════════════════════════════════')
  console.log('  ACE Chatbot — local eval')
  console.log('══════════════════════════════════════════════════════════════')
  console.log(`  Providers: ${providerLabels.join(' | ')}`)
  console.log(`  Test cases: ${caseCount}`)
  if (MOCK) {
    console.log('  [MOCK] RUN_LOCAL_EVAL_MOCK=1 — placeholder responses, no API calls')
  }
  console.log('══════════════════════════════════════════════════════════════')
  console.log('')
}

/**
 * @param {TestCase} tc
 * @param {string} providerLabel
 * @param {string} raw
 * @param {{ onTopic: string, validJson: string, concise: string }} checks
 */
function printProviderBlock(tc, providerLabel, raw, checks) {
  console.log('  ┌────────────────────────────────────────────────────────')
  console.log(`  │ Provider: ${providerLabel}`)
  console.log('  ├────────────────────────────────────────────────────────')
  const lines = (raw || '').split('\n')
  if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
    console.log('  │ (raw) <empty>')
  } else {
    for (const line of lines) {
      console.log(`  │ ${line}`)
    }
  }
  console.log('  ├────────────────────────────────────────────────────────')
  console.log(
    `  │ Checks:  onTopic=${checks.onTopic}  validJson=${checks.validJson}  concise=${checks.concise}`,
  )
  console.log('  └────────────────────────────────────────────────────────')
  console.log('')
}

/**
 * @param {TestCase} tc
 * @param {Array<{ label: string, raw: string, checks: { onTopic: string, validJson: string, concise: string } }>} providerRows
 */
function printTestCaseSection(tc, providerRows) {
  console.log('──────────────────────────────────────────────────────────────')
  console.log(`Test case: ${tc.id}`)
  console.log('Prompt:')
  console.log(tc.prompt)
  console.log('──────────────────────────────────────────────────────────────')
  console.log('')

  for (const row of providerRows) {
    printProviderBlock(tc, row.label, row.raw, row.checks)
  }
}

// --- Mock / structure-only (Pass 1) ----------------------------------------

function mockRawForCase(tc) {
  if (tc.expectsJson) {
    return '{"dishes":["poisson cru","fafa"]}'
  }
  return 'A staple in Tahitian cooking is fresh coconut, used in both savory and sweet dishes.'
}

// --- Data wiring (Pass 2) ---------------------------------------------------

const SUPPORTED = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gpt-4.1',
  'claude-sonnet-4-20250514',
])

/** @param {string} modelId */
function getLanguageModel(modelId) {
  if (!SUPPORTED.has(modelId)) {
    throw new Error(`Unsupported model: ${modelId}`)
  }
  if (modelId.startsWith('gemini-')) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY')
    }
    return google(modelId)
  }
  if (modelId.startsWith('gpt-')) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY')
    }
    return openai(modelId)
  }
  if (modelId.startsWith('claude-')) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Missing ANTHROPIC_API_KEY')
    }
    return anthropic(modelId)
  }
  throw new Error(`Unsupported model: ${modelId}`)
}

/**
 * @param {string} modelId
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function generateAssistantText(modelId, prompt) {
  const model = getLanguageModel(modelId)
  const result = await generateText({
    model,
    prompt,
  })
  return result.text ?? ''
}

function validateEnvForRun() {
  const missing = []
  for (const p of PROVIDER_CONFIG) {
    if (p.id.startsWith('gemini-') && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      missing.push(`${p.id}: set GOOGLE_GENERATIVE_AI_API_KEY`)
    } else if (p.id.startsWith('gpt-') && !process.env.OPENAI_API_KEY) {
      missing.push(`${p.id}: set OPENAI_API_KEY`)
    } else if (p.id.startsWith('claude-') && !process.env.ANTHROPIC_API_KEY) {
      missing.push(`${p.id}: set ANTHROPIC_API_KEY`)
    }
  }
  if (missing.length) {
    console.error('[eval] Missing credentials:\n' + missing.map((m) => '  - ' + m).join('\n'))
    process.exit(1)
  }
}

// --- Derived logic (Pass 3) ------------------------------------------------

/**
 * Words = split on whitespace (trim then split, filter empty).
 * @param {string} s
 * @returns {number}
 */
function wordCount(s) {
  return (s ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

/**
 * @param {string} text
 * @param {string[]} keywords
 * @returns {{ pass: boolean, detail: string }}
 */
function checkOnTopic(text, keywords) {
  if (!keywords || keywords.length === 0) {
    return { pass: false, detail: 'fail (no on-topic keywords configured for this test case)' }
  }
  const t = (text ?? '').toLowerCase()
  const hit = keywords.some((k) => t.includes((k ?? '').toLowerCase()))
  return hit
    ? { pass: true, detail: 'pass' }
    : { pass: false, detail: 'fail (no keyword/phrase match)' }
}

/**
 * @param {boolean} expectsJson
 * @param {string} text
 * @returns {{ display: 'pass' | 'fail' | 'n/a', pass: boolean | null }}
 */
function checkValidJson(expectsJson, text) {
  if (!expectsJson) {
    return { display: 'n/a', pass: null }
  }
  try {
    JSON.parse(text ?? '')
    return { display: 'pass', pass: true }
  } catch {
    return { display: 'fail', pass: false }
  }
}

/**
 * @param {string} text
 * @param {number} maxWords
 * @returns {{ pass: boolean, detail: string }}
 */
function checkConcise(text, maxWords) {
  const n = wordCount(text)
  if (n <= maxWords) {
    return { pass: true, detail: 'pass' }
  }
  return { pass: false, detail: `fail (${n} words > limit ${maxWords})` }
}

/**
 * @param {TestCase} tc
 * @param {string} raw
 * @returns {{ onTopic: string, validJson: string, concise: string }}
 */
function formatChecks(tc, raw) {
  const ot = checkOnTopic(raw, tc.onTopicKeywords)
  const vj = checkValidJson(tc.expectsJson, raw)
  const cc = checkConcise(raw, tc.maxWords)

  return {
    onTopic: ot.detail,
    validJson: vj.display,
    concise: cc.detail,
  }
}

// --- Main -------------------------------------------------------------------

async function main() {
  const labels = PROVIDER_CONFIG.map((p) => p.label)

  if (MOCK) {
    printHeader(labels, TEST_CASES.length)
    for (const tc of TEST_CASES) {
      const raw = mockRawForCase(tc)
      const rows = PROVIDER_CONFIG.map((p) => ({
        label: p.label,
        raw,
        checks: formatChecks(tc, raw),
      }))
      printTestCaseSection(tc, rows)
    }
    console.log('Done (mock).')
    return
  }

  validateEnvForRun()
  printHeader(labels, TEST_CASES.length)

  let hadError = false

  for (const tc of TEST_CASES) {
    const providerRows = []

    for (const p of PROVIDER_CONFIG) {
      let raw = ''
      try {
        process.stderr.write(`[eval] ${tc.id} / ${p.id} — requesting…\n`)
        raw = await generateAssistantText(p.id, tc.prompt)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error(`[eval] ${tc.id} / ${p.id} — ERROR: ${msg}\n`)
        hadError = true
        providerRows.push({
          label: p.label,
          raw: '',
          checks: {
            onTopic: '— (error)',
            validJson: '— (error)',
            concise: '— (error)',
          },
        })
        continue
      }

      const checks = formatChecks(tc, raw)
      providerRows.push({ label: p.label, raw, checks })
    }

    printTestCaseSection(tc, providerRows)
  }

  console.log('══════════════════════════════════════════════════════════════')
  console.log(hadError ? 'Done (with errors — exit code 1).' : 'Done.')
  console.log('══════════════════════════════════════════════════════════════\n')
  if (hadError) {
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
