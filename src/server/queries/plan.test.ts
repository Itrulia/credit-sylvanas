import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { DAILY_CHANGE_SQL } from './heatmap.ts'
import { OWN_HISTORY_SQL } from './history.ts'
import { CURRENT_SQL } from './item.ts'
import { REGIONS_SQL } from './status.ts'

// Without sqlite_stat1 the planner picks the (region, day, item_id) primary key
// and reads the whole 90-day region block per item. Pin the item index.
async function plan(sql: string, ...binds: unknown[]): Promise<string> {
  const rows = await env.DB.prepare(`EXPLAIN QUERY PLAN ${sql}`)
    .bind(...binds)
    .all<{ detail: string }>()
  return rows.results.map((r) => r.detail).join('\n')
}

describe('item-scoped region_snapshots reads use the item index', () => {
  it.each([
    ['own history', OWN_HISTORY_SQL, [1, 'us']],
    ['current', CURRENT_SQL, [1, 'us']],
    ['daily change', DAILY_CHANGE_SQL, ['us', '[1,2]']],
  ] as const)('%s', async (_, sql, binds) => {
    const detail = await plan(sql, ...binds)
    expect(detail).toMatch(
      /SEARCH region_snapshots USING (COVERING )?INDEX region_snapshots_item/,
    )
  })
})

describe('status reads', () => {
  // imports is never pruned and grows with every realm scan
  it('use the imports status index', async () => {
    expect(await plan(REGIONS_SQL)).toMatch(/INDEX imports_status/)
  })
})
