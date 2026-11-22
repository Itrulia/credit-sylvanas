import '@tanstack/react-start/server-only'
import type { FetchFn } from './ingest.ts'

export const PURGE_URL = 'https://api.cloudflare.com/client/v4/zones'

export interface PurgeConfig {
  CF_PURGE_TOKEN?: string
  CF_ZONE_ID?: string
}

/**
 * Drops every cached page on the zone. Optional on top of the versioned cache
 * keys: a no-op without the secret, and a failure only gets logged.
 */
export async function purgeEdgeCache(
  { CF_PURGE_TOKEN: token, CF_ZONE_ID: zone }: PurgeConfig,
  fetchFn: FetchFn,
) {
  if (!token || !zone) {
    return
  }
  try {
    const res = await fetchFn(`${PURGE_URL}/${zone}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purge_everything: true }),
    })
    if (!res.ok) {
      console.error(`cache purge failed: HTTP ${res.status}`)
    }
  } catch (error) {
    console.error('cache purge failed', error)
  }
}
