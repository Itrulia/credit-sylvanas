import { setResponseHeader } from '@tanstack/react-start/server'

// The edge keeps an hour under a key that changes with each import. Browsers
// revalidate: their cache key has no data version, so a kept server fn
// response could mix stale JSON into fresh HTML after an import.
export const PUBLIC_CACHE = 'public, max-age=0, s-maxage=3600'

export const cachePublic = () =>
  setResponseHeader('Cache-Control', PUBLIC_CACHE)
