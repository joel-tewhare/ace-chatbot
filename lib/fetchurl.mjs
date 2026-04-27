/**
 * Shared `fetchUrl` tool logic (used by `app/api/chat/route.ts` and `evals.mjs`).
 * Keep this file in sync with tool registration and copy in the route.
 */

export const FETCH_URL_MAX_CHARS = 5000

const FETCH_TIMEOUT_MS = 20_000
const MAX_BODY_CHARS_TO_PARSE = 2_000_000

/** @typedef {{ ok: true, text: string } | { ok: false, code: string, message: string }} FetchUrlToolResult */

/**
 * @param {string} input
 * @returns {string}
 */
function htmlToPlainText(input) {
  if (!input) return ''
  let s = input
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
  s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|table|section|article|header|footer)>/gi, '\n')
  s = s.replace(/<[^>]+>/g, ' ')
  s = s.replace(/&nbsp;/gi, ' ')
  s = s.replace(/&amp;/g, '&')
  s = s.replace(/&lt;/g, '<')
  s = s.replace(/&gt;/g, '>')
  s = s.replace(/&quot;/g, '"')
  s = s.replace(/&#(x?)([0-9A-Fa-f]+);/g, (_, isHex, num) => {
    const n = parseInt(num, isHex ? 16 : 10)
    try {
      return String.fromCodePoint(n)
    } catch {
      return ''
    }
  })
  s = s.replace(/\s+/g, ' ')
  return s.trim()
}

/**
 * @param {string} raw
 * @returns {{ ok: true, href: string } | { ok: false, message: string, code: string }}
 */
export function validatePublicHttpUrl(raw) {
  if (raw == null || typeof raw !== 'string' || raw.trim() === '') {
    return { ok: false, code: 'invalid_url', message: 'The URL is missing or not valid for fetching.' }
  }
  /** @type {URL} */
  let u
  try {
    u = new URL(raw.trim())
  } catch {
    return { ok: false, code: 'invalid_url', message: 'The URL is missing or not valid for fetching.' }
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, code: 'invalid_url', message: 'Only http and https URLs can be fetched.' }
  }
  if (u.username || u.password) {
    return { ok: false, code: 'invalid_url', message: 'URLs with login details are not supported.' }
  }
  const host = u.hostname.toLowerCase()
  if (host === 'localhost' || host === '0.0.0.0' || host === '[::1]' || host.endsWith('.localhost')) {
    return { ok: false, code: 'blocked_host', message: "That address can't be fetched from this app." }
  }
  if (host.startsWith('127.')) {
    return { ok: false, code: 'blocked_host', message: "That address can't be fetched from this app." }
  }
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (ipv4) {
    const a = Number(ipv4[1])
    const b = Number(ipv4[2])
    if (a === 10) {
      return { ok: false, code: 'blocked_host', message: "That address can't be fetched from this app." }
    }
    if (a === 192 && b === 168) {
      return { ok: false, code: 'blocked_host', message: "That address can't be fetched from this app." }
    }
    if (a === 172 && b >= 16 && b <= 31) {
      return { ok: false, code: 'blocked_host', message: "That address can't be fetched from this app." }
    }
    // Link-local / cloud metadata (RFC 3927 APIPA, e.g. 169.254.169.254)
    if (a === 169 && b === 254) {
      return { ok: false, code: 'blocked_host', message: "That address can't be fetched from this app." }
    }
    if (a === 127) {
      return { ok: false, code: 'blocked_host', message: "That address can't be fetched from this app." }
    }
  }
  return { ok: true, href: u.href }
}

/**
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function truncateText(text, max) {
  if (text.length <= max) return text
  return text.slice(0, max)
}

/**
 * @param {{ url: string }} param0
 * @returns {Promise<FetchUrlToolResult>}
 */
export async function runFetchUrlTool({ url }) {
  if (url == null || typeof url !== 'string') {
    return { ok: false, code: 'invalid_url', message: 'The URL is missing or not valid for fetching.' }
  }
  const checked = validatePublicHttpUrl(url)
  if (!checked.ok) {
    return { ok: false, code: checked.code, message: checked.message }
  }

  const target = checked.href
  let res
  try {
    res = await fetch(target, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Accept: 'text/html, text/plain, application/xhtml+xml, */*',
        'User-Agent': 'ACE-Chatbot/0.1 (tutorial; +https://example.invalid)',
      },
    })
  } catch (e) {
    const name = e && typeof e === 'object' && 'name' in e ? String(/** @type {{ name: unknown }} */ (e).name) : ''
    if (name === 'TimeoutError' || name === 'AbortError') {
      return {
        ok: false,
        code: 'network_error',
        message: 'The request timed out or was aborted.',
      }
    }
    return {
      ok: false,
      code: 'network_error',
      message: 'The page could not be reached (network error).',
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      code: 'http_error',
      message: `The page could not be loaded (HTTP ${res.status}).`,
    }
  }

  let body
  try {
    body = await res.text()
  } catch {
    return {
      ok: false,
      code: 'network_error',
      message: 'The page could not be reached (network error).',
    }
  }
  if (body.length > MAX_BODY_CHARS_TO_PARSE) {
    body = body.slice(0, MAX_BODY_CHARS_TO_PARSE)
  }

  const ct = (res.headers.get('content-type') ?? '').toLowerCase()
  let plain
  if (ct.includes('text/html') || ct.includes('application/xhtml') || (ct.includes('text/') && ct.includes('xml'))) {
    plain = htmlToPlainText(body)
  } else {
    plain = body.replace(/\s+/g, ' ').trim()
  }
  if (!plain || plain.length === 0) {
    return { ok: false, code: 'empty_content', message: 'The page had no extractable text.' }
  }

  const text = truncateText(plain, FETCH_URL_MAX_CHARS)
  return { ok: true, text }
}
