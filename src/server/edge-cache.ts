import '@tanstack/react-start/server-only'

type EdgeCache = Pick<Cache, 'match' | 'put'>

const cacheable = (request: Request, response: Response) =>
  request.method === 'GET' &&
  response.status === 200 &&
  /\bpublic\b/.test(response.headers.get('Cache-Control') ?? '') &&
  !response.headers.has('Set-Cookie')

/**
 * Workers don't cache their own responses on a Cache-Control header alone, so
 * public 200 GETs go through the Cache API keyed by the full URL. A no-op off
 * a custom domain.
 */
export async function cachedFetch(
  request: Request,
  ctx: Pick<ExecutionContext, 'waitUntil'>,
  handler: () => Promise<Response> | Response,
  // the DOM lib's CacheStorage type hides the Workers-only `default` cache
  cache: EdgeCache = (caches as unknown as { default: Cache }).default,
): Promise<Response> {
  if (request.method === 'GET') {
    const hit = await cache.match(request)
    if (hit) {
      return hit
    }
  }
  const response = await handler()
  if (cacheable(request, response)) {
    ctx.waitUntil(cache.put(request, response.clone()))
  }
  return response
}
