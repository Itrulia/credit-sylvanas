import { expect, it, vi } from 'vitest'
import { formatResults, triggerIngest } from './ingest-trigger.ts'
import type { TriggerResult } from './ingest-trigger.ts'

const results: TriggerResult[] = [
  {
    url: 'https://public-data.tradeskillmaster.com/forever/eu/region/items.csv',
    status: 'imported',
    rows: 7843,
    reason: null,
  },
  {
    url: 'https://public-data.tradeskillmaster.com/forever/us/region/items.csv',
    status: 'skipped',
    rows: 0,
    reason: 'not modified',
  },
]

it('posts to the trigger with the bearer token and returns the results', async () => {
  const fetchFn = vi.fn(async () => Response.json({ results }))
  expect(
    await triggerIngest({
      base: 'https://site.test',
      token: 'secret',
      kind: 'realm',
      fetchFn,
    }),
  ).toEqual(results)
  expect(fetchFn).toHaveBeenCalledWith(
    'https://site.test/__ingest?kind=realm',
    {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' },
    },
  )
})

it('throws with the status and the error, never the token', async () => {
  const fetchFn = vi.fn(async () =>
    Response.json({ error: 'unauthorized' }, { status: 401 }),
  )
  const call = triggerIngest({
    base: 'https://site.test',
    token: 'secret',
    kind: 'region',
    fetchFn,
  })
  await expect(call).rejects.toThrow('HTTP 401: unauthorized')
  await expect(call).rejects.not.toThrow(/secret/)
})

it('prints one line per file', () => {
  expect(formatResults(results)).toBe(
    [
      'imported  eu region  7843 rows',
      'skipped   us region  0 rows  (not modified)',
    ].join('\n'),
  )
})
