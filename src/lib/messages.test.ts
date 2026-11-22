import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

type Variants = Array<{ match: Record<string, string> }>
const catalog = JSON.parse(readFileSync('messages/en.json', 'utf8')) as Record<
  string,
  string | Variants
>

const patterns = Object.entries(catalog)
  .filter(([id]) => id !== '$schema')
  .flatMap(([id, msg]) =>
    typeof msg === 'string'
      ? [[id, msg] as const]
      : msg.flatMap((v) =>
          Object.entries(v.match).map(([k, p]) => [`${id} ${k}`, p] as const),
        ),
  )

describe('messages/en.json', () => {
  it.each(patterns)('%s is non-empty copy without an em dash', (_, text) => {
    expect(text.trim()).not.toBe('')
    expect(text).not.toContain('—')
  })
})
