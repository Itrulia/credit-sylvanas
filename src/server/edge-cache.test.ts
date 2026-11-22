import { env } from 'cloudflare:workers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetTables } from './test/reset.ts'
import { cachedFetch, dataVersion, resetDataVersion } from './edge-cache.ts'

resetTables()
beforeEach(resetDataVersion)

const v1 = async () => '1'

function fakeCache() {
  const store = new Map<string, Response>()
  return {
    store,
    match: vi.fn(async (req: RequestInfo | URL) =>
      store.get(new Request(req).url)?.clone(),
    ),
    put: vi.fn(async (req: RequestInfo | URL, res: Response) => {
      store.set(new Request(req).url, res)
    }),
  }
}

const ctx = () => {
  const pending: Promise<unknown>[] = []
  return { pending, waitUntil: (p: Promise<unknown>) => void pending.push(p) }
}

describe('cachedFetch', () => {
  it('caches a public 200 GET and serves the next request from the cache', async () => {
    const cache = fakeCache()
    const c = ctx()
    const req = new Request('https://site.test/us?x=1')
    const handler = vi.fn(
      async () =>
        new Response('hi', {
          headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' },
        }),
    )
    await cachedFetch(req, c, handler, v1, cache)
    await Promise.all(c.pending)
    expect(cache.put).toHaveBeenCalledTimes(1)
    const second = await cachedFetch(
      new Request('https://site.test/us?x=1'),
      c,
      handler,
      v1,
      cache,
    )
    expect(await second.text()).toBe('hi')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it.each([
    [
      'a no-store 503',
      new Response('no', {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }),
    ],
    [
      'a Set-Cookie response',
      new Response('x', {
        headers: { 'Cache-Control': 'public', 'Set-Cookie': 'a=b' },
      }),
    ],
    [
      'a private 200',
      new Response('x', { headers: { 'Cache-Control': 'private' } }),
    ],
    [
      'a public 404',
      new Response('x', {
        status: 404,
        headers: { 'Cache-Control': 'public' },
      }),
    ],
  ])('does not cache %s', async (_, response) => {
    const cache = fakeCache()
    const c = ctx()
    await cachedFetch(
      new Request('https://site.test/us'),
      c,
      () => response,
      v1,
      cache,
    )
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('never caches a POST', async () => {
    const cache = fakeCache()
    const res = new Response('x', { headers: { 'Cache-Control': 'public' } })
    await cachedFetch(
      new Request('https://site.test/_fn', { method: 'POST' }),
      ctx(),
      () => res,
      v1,
      cache,
    )
    expect(cache.match).not.toHaveBeenCalled()
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('skips the cache when the version read fails, so the app renders its own 500', async () => {
    const cache = fakeCache()
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = new Response('page', { status: 500 })
    const out = await cachedFetch(
      new Request('https://site.test/eu'),
      ctx(),
      () => res,
      () => Promise.reject(new Error('no such table: imports')),
      cache,
    )
    expect(out).toBe(res)
    expect(cache.match).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalled()
    log.mockRestore()
  })

  it('keys the cache by data version, so a new import misses', async () => {
    const cache = fakeCache()
    const c = ctx()
    const handler = vi.fn(
      async () =>
        new Response('hi', { headers: { 'Cache-Control': 'public' } }),
    )
    await cachedFetch(
      new Request('https://site.test/us'),
      c,
      handler,
      v1,
      cache,
    )
    await Promise.all(c.pending)
    expect([...cache.store.keys()]).toEqual(['https://site.test/us?__v=1'])
    await cachedFetch(
      new Request('https://site.test/us'),
      c,
      handler,
      async () => '2',
      cache,
    )
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('drops query params no route knows and sorts the rest, so junk params share one entry', async () => {
    const cache = fakeCache()
    const c = ctx()
    const handler = vi.fn(
      async (_req: Request) =>
        new Response('hi', { headers: { 'Cache-Control': 'public' } }),
    )
    await cachedFetch(
      new Request('https://site.test/us/items?sort=name&fbclid=abc&page=2'),
      c,
      handler,
      v1,
      cache,
    )
    await Promise.all(c.pending)
    expect([...cache.store.keys()]).toEqual([
      'https://site.test/us/items?page=2&sort=name&__v=1',
    ])
    expect(handler.mock.calls[0][0].url).toBe(
      'https://site.test/us/items?page=2&sort=name',
    )
    await cachedFetch(
      new Request('https://site.test/us/items?x=1&page=2&sort=name'),
      c,
      handler,
      v1,
      cache,
    )
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('leaves server fn URLs alone', async () => {
    const cache = fakeCache()
    const handler = vi.fn(
      async (_req: Request) =>
        new Response('hi', { headers: { 'Cache-Control': 'public' } }),
    )
    const url = 'https://site.test/_serverFn/abc?payload=%7B%7D'
    await cachedFetch(new Request(url), ctx(), handler, v1, cache)
    expect(handler.mock.calls[0][0].url).toBe(url)
  })
})

const insertImport = (status: string) =>
  env.DB.prepare(
    `INSERT INTO imports (region, kind, source_url, fetched_at, status) VALUES ('us', 'region', 'u', 1, ?1)`,
  )
    .bind(status)
    .run()

describe('dataVersion', () => {
  it('is the latest imported id and ignores skipped and failed rows', async () => {
    expect(await dataVersion(env.DB, 0)).toBe('0')
    await insertImport('imported')
    await insertImport('imported')
    await insertImport('skipped')
    await insertImport('failed')
    const { id } = (await env.DB.prepare(
      `SELECT max(id) AS id FROM imports WHERE status = 'imported'`,
    ).first<{ id: number }>())!
    expect(await dataVersion(env.DB, 100_000)).toBe(String(id))
  })

  it('reads D1 at most once a minute per isolate', async () => {
    await insertImport('imported')
    const first = await dataVersion(env.DB, 0)
    await insertImport('imported')
    expect(await dataVersion(env.DB, 59_000)).toBe(first)
    expect(await dataVersion(env.DB, 61_000)).not.toBe(first)
  })
})
