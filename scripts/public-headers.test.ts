import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { HEADERS } from '#/server/security-headers'

// Prerendered pages and /assets are served by the asset layer, never the
// Worker, so public/_headers has to repeat what withSecurityHeaders adds.
function rules(text: string) {
  const out = new Map<string, Map<string, string>>()
  let current: Map<string, string> | null = null
  for (const line of text.split('\n')) {
    if (!line.trim() || line.startsWith('#')) {
      continue
    }
    if (!/^\s/.test(line)) {
      current = new Map()
      out.set(line.trim(), current)
      continue
    }
    const at = line.indexOf(':')
    current?.set(line.slice(0, at).trim(), line.slice(at + 1).trim())
  }
  return out
}

describe('public/_headers', () => {
  const parsed = rules(readFileSync('public/_headers', 'utf8'))

  it('sends every Worker security header on static files too', () => {
    expect(Object.fromEntries(parsed.get('/*') ?? [])).toEqual(HEADERS)
  })

  it('caches content-hashed assets for a year', () => {
    expect(parsed.get('/assets/*')?.get('Cache-Control')).toBe(
      'public, max-age=31536000, immutable',
    )
  })
})
