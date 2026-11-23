import '@tanstack/react-start/server-only'
import { REALMS } from '../../config/realms.ts'
import type { RealmConfig } from '../../config/realms.ts'
import { REGIONS } from '../../config/regions.ts'
import type { ArchiveBucket } from './archive.ts'
import { runIngest } from './ingest.ts'
import type { FetchFn } from './ingest.ts'
import { purgeEdgeCache } from './purge.ts'
import type { PurgeConfig } from './purge.ts'

// Must match wrangler.jsonc "triggers.crons" character for character.
// Hourly, because TSM publishes each region's daily file at its own time (EU
// was out by 08:04 UTC on 2026-11-23, NA by 08:50 UTC on 2026-11-22). An
// unchanged file answers 304, so a check downloads and stores nothing.
export const REGION_CRON = '50 * * * *'
export const REALM_CRON = '15 */3 * * *'

export const TSM_BASE = 'https://public-data.tradeskillmaster.com'

export interface Job {
  region: (typeof REGIONS)[number]
  kind: 'region' | 'realm'
  /** '{slug}-{faction}' for realm files */
  realm: string | null
  slug: string | null
  faction: 'alliance' | 'horde' | null
  url: string
}

export function buildJobs(
  kind: 'region' | 'realm',
  realms: readonly RealmConfig[] = REALMS,
): Job[] {
  if (kind === 'region') {
    return REGIONS.map((region) => ({
      region,
      kind,
      realm: null,
      slug: null,
      faction: null,
      url: `${TSM_BASE}/forever/${region}/region/items.csv`,
    }))
  }
  return realms.flatMap((r) =>
    (['alliance', 'horde'] as const).map((faction) => {
      const realm = `${r.slug}-${faction}`
      return {
        region: r.region,
        kind,
        realm,
        slug: r.slug,
        faction,
        url: `${TSM_BASE}/forever/${r.region}/realm/${realm}/items.csv`,
      }
    }),
  )
}

export type IngestEnv = { DB: D1Database; ARCHIVE: ArchiveBucket } & PurgeConfig

// wrapped: passing the bare global around can lose its receiver in workerd
const globalFetch: FetchFn = (u, i) => fetch(u, i)

/** One ingest job: fetch, log, purge after an import. Never throws for a failed file. */
export async function runJob(
  kind: 'region' | 'realm',
  now: number,
  env: IngestEnv,
  fetchFn: FetchFn = globalFetch,
) {
  const results = await runIngest(env.DB, env.ARCHIVE, fetchFn, { kind, now })
  for (const r of results) {
    console.log(
      `ingest ${r.status}: ${r.url} (${r.rows} rows)${r.reason ? `: ${r.reason}` : ''}`,
    )
  }
  if (results.some((r) => r.status === 'imported')) {
    await purgeEdgeCache(env, fetchFn)
  }
  return results
}

export async function runScheduled(
  controller: Pick<ScheduledController, 'cron' | 'scheduledTime'>,
  env: IngestEnv,
  fetchFn: FetchFn = globalFetch,
) {
  const kind =
    controller.cron === REGION_CRON
      ? 'region'
      : controller.cron === REALM_CRON
        ? 'realm'
        : null
  if (!kind) {
    // fail loudly if wrangler.jsonc drifts
    throw new Error(`Unknown cron ${controller.cron}`)
  }
  const results = await runJob(kind, controller.scheduledTime, env, fetchFn)
  // a missing file is normal for the bucket; anything else marks the cron run as failed
  const broken = results.filter(
    (r) => r.status === 'failed' && r.reason !== 'no such file',
  )
  if (broken.length > 0) {
    throw new Error(
      `ingest failed: ${broken.map((r) => `${r.url}: ${r.reason}`).join('; ')}`,
    )
  }
  return results
}
