import { UMAMI_SCRIPT } from '../lib/analytics/umami.ts'
import { WOWHEAD_SCRIPT } from '../lib/wowhead.ts'

const umami = new URL(UMAMI_SCRIPT).origin
const zamimg = new URL(WOWHEAD_SCRIPT).origin
const nether = 'https://nether.wowhead.com'

// Directives that no third-party script can trip over are enforced now.
const ENFORCED = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

// shortcut: report-only until the Wowhead and Umami hosts are confirmed in a
// production browser console; then move it into Content-Security-Policy.
// 'unsafe-inline' covers Start's hydration scripts and the chart <style>.
const REPORT_ONLY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${zamimg} ${nether} ${umami}`,
  `connect-src 'self' ${umami} https://api-gateway.umami.dev https://gateway.umami.is ${nether}`,
  `img-src 'self' data: ${zamimg}`,
  `style-src 'self' 'unsafe-inline' ${zamimg}`,
  "font-src 'self'",
  ENFORCED,
].join('; ')

export const HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': ENFORCED,
  'Content-Security-Policy-Report-Only': REPORT_ONLY,
}

/** Copies the response, since cache hits and redirects have immutable headers. */
export function withSecurityHeaders(response: Response): Response {
  const res = new Response(response.body, response)
  for (const [name, value] of Object.entries(HEADERS)) {
    res.headers.set(name, value)
  }
  return res
}
