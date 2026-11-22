import '@tanstack/react-start/server-only'
import {
  contextSearch,
  heatmapSearch,
  itemSearch,
  itemsSearch,
  marketSearch,
  realmsSearch,
} from '../lib/search.ts'

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

/**
 * Cache key version: the Worker deploy plus the data. HTML cached before a
 * deploy names hashed asset files the new deploy no longer serves (404), so
 * a deploy must miss every old entry just like an import does.
 */
export const pageVersion = async (
  db: D1Database,
  deployId: string,
  now = Date.now(),
) => `${deployId}.${await dataVersion(db, now)}`

export const resetDataVersion = () => {
  memo = null
}

const KNOWN_PARAMS = new Set(
  [
    contextSearch,
    heatmapSearch,
    itemSearch,
    itemsSearch,
    marketSearch,
    realmsSearch,
  ].flatMap((schema) => Object.keys(schema.shape)),
)

/**
 * Pages render the same with or without params no route validates (fbclid,
 * ?x=1), so they are dropped before render and cache lookup: junk can't
 * bypass the cache. Server fn URLs are built by Start and pass unchanged.
 */
export function canonicalRequest(request: Request): Request {
  const url = new URL(request.url)
  if (url.pathname.startsWith('/_serverFn/') || !url.search) {
    return request
  }
  const kept = [...url.searchParams].filter(([k]) => KNOWN_PARAMS.has(k))
  kept.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const search = new URLSearchParams(kept).toString()
  if (search === url.search.slice(1)) {
    return request
  }
  url.search = search
  return new Request(url, request)
}

const versionedKey = (request: Request, version: string) => {
  const url = new URL(request.url)
  url.searchParams.append('__v', version)
  return new Request(url)
}

/**
 * Workers don't cache their own responses on a Cache-Control header alone, so
 * public 200 GETs go through the Cache API keyed by the canonical URL plus the
 * data version. A no-op off a custom domain.
 */
export async function cachedFetch(
  request: Request,
  ctx: Pick<ExecutionContext, 'waitUntil'>,
  handler: (request: Request) => Promise<Response> | Response,
  version: () => Promise<string>,
  // the DOM lib's CacheStorage type hides the Workers-only `default` cache
  cache: EdgeCache = (caches as unknown as { default: Cache }).default,
): Promise<Response> {
  if (request.method !== 'GET') {
    return handler(request)
  }
  request = canonicalRequest(request)
  let current: string
  try {
    current = await version()
  } catch (error) {
    // an uncaught throw here shows the runtime's error page instead of ours
    console.error(error)
    return handler(request)
  }
  const key = versionedKey(request, current)
  const hit = await cache.match(key)
  if (hit) {
    return hit
  }
  const response = await handler(request)
  if (cacheable(request, response)) {
    ctx.waitUntil(cache.put(key, response.clone()))
  }
  return response
}
