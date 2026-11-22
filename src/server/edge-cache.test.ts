import { describe, expect, it, vi } from 'vitest'
import { cachedFetch } from './edge-cache.ts'

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
    await cachedFetch(req, c, handler, cache)
    await Promise.all(c.pending)
    expect(cache.put).toHaveBeenCalledTimes(1)
    const second = await cachedFetch(
      new Request('https://site.test/us?x=1'),
      c,
      handler,
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
      cache,
    )
    expect(cache.match).not.toHaveBeenCalled()
    expect(cache.put).not.toHaveBeenCalled()
  })
})
