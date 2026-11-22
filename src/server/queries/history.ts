import '@tanstack/react-start/server-only'
import type { Faction, Region } from '../../lib/search.ts'
import type { ItemHistory } from '../types.ts'

export interface HistoryArgs {
  region: Region
  itemId: number
  realm?: string
  faction?: Faction
}

const cur = `(SELECT max(day) FROM region_snapshots WHERE region = ?2)`

// INDEXED BY: see gotchas.md, the planner otherwise reads the whole region block
export const OWN_HISTORY_SQL = `SELECT day, market_value, historical, avg_sale_price, sold_per_day
  FROM region_snapshots INDEXED BY region_snapshots_item WHERE item_id = ?1 AND region = ?2 AND day >= ${cur} - 89 ORDER BY day`

/** Always the full 90-day window for one item; the cards filter ranges in render. */
export async function itemHistory(
  db: D1Database,
  { region, itemId, realm, faction }: HistoryArgs,
  nowMs: number,
): Promise<ItemHistory> {
  const statements = [
    db.prepare(OWN_HISTORY_SQL).bind(itemId, region),
    db
      .prepare(
        `SELECT region, day, market_value FROM region_snapshots
         WHERE item_id = ?1 AND region <> ?2 AND day >= ${cur} - 89 AND market_value > 0 ORDER BY region, day`,
      )
      .bind(itemId, region),
  ]
  const withRealm = Boolean(realm && faction)
  if (withRealm) {
    statements.push(
      db
        .prepare(
          `SELECT updated_at, day, market_value, min_buyout FROM realm_snapshots
           WHERE region = ?1 AND realm = ?2 AND faction = ?3 AND item_id = ?4 AND updated_at >= ?5
           ORDER BY updated_at`,
        )
        .bind(
          region,
          realm,
          faction,
          itemId,
          Math.floor(nowMs / 1000) - 90 * 86_400,
        ),
    )
  }
  const [own, others, scans] =
    await db.batch<Record<string, number | string>>(statements)

  const points = own.results.map((r) => ({
    day: r.day as number,
    mv: r.market_value as number,
    hist: r.historical as number,
    asp: r.avg_sale_price as number,
    spd: r.sold_per_day as number,
  }))
  const grouped = new Map<Region, { day: number; mv: number }[]>()
  for (const r of others.results) {
    const list = grouped.get(r.region as Region) ?? []
    list.push({ day: r.day as number, mv: r.market_value as number })
    grouped.set(r.region as Region, list)
  }
  let realmHistory: ItemHistory['realm'] = null
  if (withRealm) {
    const rows = scans.results
    const lastPerDay = new Map<
      number,
      { day: number; mv: number; minBuyout: number }
    >()
    for (const r of rows) {
      lastPerDay.set(r.day as number, {
        day: r.day as number,
        mv: r.market_value as number,
        minBuyout: r.min_buyout as number,
      })
    }
    realmHistory = {
      daily: [...lastPerDay.values()],
      scans: rows.map((r) => ({
        t: r.updated_at as number,
        mv: r.market_value as number,
      })),
    }
  }
  return {
    points,
    others: [...grouped].map(([r, pts]) => ({ region: r, points: pts })),
    realm: realmHistory,
    firstDay: points[0]?.day ?? null,
  }
}
