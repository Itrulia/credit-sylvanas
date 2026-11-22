import { beforeEach } from 'vitest'
import { env } from 'cloudflare:workers'

// Every test starts from empty tables, whatever storage isolation the pool gives
export function resetTables() {
  beforeEach(async () => {
    await env.DB.batch(
      ['realm_snapshots', 'region_snapshots', 'items', 'imports'].map((t) =>
        env.DB.prepare(`DELETE FROM ${t}`),
      ),
    )
  })
}

/** Empties the Miniflare R2 bucket between ingest tests. */
export async function clearArchive() {
  const listed = await env.ARCHIVE.list()
  await Promise.all(listed.objects.map((o) => env.ARCHIVE.delete(o.key)))
}
