import { describe, expect, it, vi } from 'vitest'
import { INGEST_PATH, ingestTrigger } from './trigger.ts'

const TOKEN = 'test-token-0123456789abcdef'
const env = { INGEST_TOKEN: TOKEN } as Parameters<typeof ingestTrigger>[1]
const ctx = () => ({ waitUntil: vi.fn() })
const result = {
  url: 'https://tsm.test/forever/eu/region/items.csv',
  status: 'skipped' as const,
  rows: 0,
  reason: 'not modified',
}

const post = (path = INGEST_PATH, token: string | null = TOKEN) =>
  new Request(`https://credit-sylvanas.app${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

describe('ingestTrigger', () => {
  it('ignores every other path', async () => {
    const run = vi.fn()
    expect(await ingestTrigger(post('/eu'), env, ctx(), run)).toBeNull()
    expect(run).not.toHaveBeenCalled()
  })

  it('answers 404 while the INGEST_TOKEN secret is unset', async () => {
    const run = vi.fn()
    const res = await ingestTrigger(post(), {} as typeof env, ctx(), run)
    expect(res?.status).toBe(404)
    expect(run).not.toHaveBeenCalled()
  })

  it('answers 404 to anything but POST', async () => {
    const run = vi.fn()
    const res = await ingestTrigger(
      new Request(`https://credit-sylvanas.app${INGEST_PATH}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      }),
      env,
      ctx(),
      run,
    )
    expect(res?.status).toBe(404)
    expect(run).not.toHaveBeenCalled()
  })

  it.each([null, 'wrong', `${TOKEN}x`, TOKEN.slice(1)])(
    'answers 401 without running for token %s',
    async (token) => {
      const run = vi.fn()
      const res = await ingestTrigger(post(INGEST_PATH, token), env, ctx(), run)
      expect(res?.status).toBe(401)
      expect(run).not.toHaveBeenCalled()
    },
  )

  it('runs the region job through the cron path and returns the results', async () => {
    const run = vi.fn(async () => [result])
    const res = (await ingestTrigger(post(), env, ctx(), run))!
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(await res.json()).toEqual({ results: [result] })
    expect(run).toHaveBeenCalledWith('region', expect.any(Number), env)
  })

  it('runs the realm job for ?kind=realm and refuses unknown kinds', async () => {
    const run = vi.fn(async () => [])
    await ingestTrigger(post(`${INGEST_PATH}?kind=realm`), env, ctx(), run)
    expect(run).toHaveBeenCalledWith('realm', expect.any(Number), env)
    const bad = await ingestTrigger(
      post(`${INGEST_PATH}?kind=x`),
      env,
      ctx(),
      run,
    )
    expect(bad?.status).toBe(400)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('keeps the job alive if the caller disconnects', async () => {
    const c = ctx()
    const run = vi.fn(async () => [result])
    await ingestTrigger(post(), env, c, run)
    expect(c.waitUntil).toHaveBeenCalledWith(expect.any(Promise))
  })

  it('returns every result when one file failed', async () => {
    const failed = { ...result, status: 'failed' as const, reason: 'HTTP 500' }
    const imported = {
      ...result,
      status: 'imported' as const,
      rows: 10,
      reason: null,
    }
    const run = vi.fn(async () => [imported, failed])
    const res = (await ingestTrigger(post(), env, ctx(), run))!
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ results: [imported, failed] })
  })

  it('answers 500 with the reason when the ingest throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const run = vi.fn(async () => {
      throw new Error('ingest failed: HTTP 500')
    })
    const res = (await ingestTrigger(post(), env, ctx(), run))!
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'ingest failed: HTTP 500' })
    error.mockRestore()
  })
})
