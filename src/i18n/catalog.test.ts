import { describe, expect, it } from 'vitest'
import { m } from './index'

// Every param defaults to 3. A message that needs another shape (a string it
// calls methods on, an array) gets a sample here, keyed `area.key`.
const SAMPLES: Record<string, Record<string, unknown>> = {
  'format.dateTime': {
    day: '22',
    month: 'Nov',
    year: '2026',
    time: '04:10',
  },
}

const params = (id: string) =>
  new Proxy(SAMPLES[id] ?? {}, {
    get: (target, key) => (key in target ? target[key as string] : 3),
  })

const messages = Object.entries(m).flatMap(([area, catalog]) =>
  Object.entries(catalog).map(
    ([key, fn]) => [`${area}.${key}`, fn as (p: unknown) => unknown] as const,
  ),
)

describe('catalog', () => {
  it.each(messages)(
    '%s returns non-empty copy without an em dash',
    (id, fn) => {
      const out = fn(params(id))
      expect(typeof out).toBe('string')
      expect((out as string).trim()).not.toBe('')
      expect(out).not.toContain('—')
    },
  )
})
