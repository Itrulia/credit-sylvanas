import { setResponseHeader } from '@tanstack/react-start/server'

// Browsers keep 5 minutes, the edge an hour (DESIGN §3 Edge caching).
export const PUBLIC_CACHE = 'public, max-age=300, s-maxage=3600'

export const cachePublic = () =>
  setResponseHeader('Cache-Control', PUBLIC_CACHE)
