import '@tanstack/react-start/server-only'

type EdgeCache = Pick<Cache, 'match' | 'put'>

const cacheable = (request: Request, response: Response) =>
  request.method === 'GET' &&
  response.status === 200 &&
  /\bpublic\b/.test(response.headers.get('Cache-Control') ?? '') &&
  !response.headers.has('Set-Cookie')

const VERSION_TTL_MS = 60_000
let memo: { at: number; version: string } | null = null

/**
 * Latest imported import id. A new import changes it, so every colo misses
 * the old cache entries; skipped and failed fetches leave it alone. Memoised
 * per isolate so a page view costs at most one D1 read a minute.
 */
export async function dataVersion(db: D1Database, now = Date.now()) {
  if (memo && now - memo.at < VERSION_TTL_MS) {
    return memo.version
  }
  // walks the rowid from the top and stops at the first imported row
  const row = await db
    .prepare(
      `SELECT id FROM imports WHERE status = 'imported' ORDER BY id DESC LIMIT 1`,
    )
    .first<{ id: number }>()
  memo = { at: now, version: String(row?.id ?? 0) }
  return memo.version
}

export const resetDataVersion = () => {
  memo = null
}

const versionedKey = (request: Request, version: string) => {
  const url = new URL(request.url)
  url.searchParams.append('__v', version)
  return new Request(url)
}

/**
 * Workers don't cache their own responses on a Cache-Control header alone, so
 * public 200 GETs go through the Cache API keyed by the full URL plus the
 * data version. A no-op off a custom domain.
 */
export async function cachedFetch(
  request: Request,
  ctx: Pick<ExecutionContext, 'waitUntil'>,
  handler: () => Promise<Response> | Response,
  version: () => Promise<string>,
  // the DOM lib's CacheStorage type hides the Workers-only `default` cache
  cache: EdgeCache = (caches as unknown as { default: Cache }).default,
): Promise<Response> {
  if (request.method !== 'GET') {
    return handler()
  }
  const key = versionedKey(request, await version())
  const hit = await cache.match(key)
  if (hit) {
    return hit
  }
  const response = await handler()
  if (cacheable(request, response)) {
    ctx.waitUntil(cache.put(key, response.clone()))
  }
  return response
}
