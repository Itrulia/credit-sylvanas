import '@tanstack/react-start/server-only'
import type { RealmConfig } from '../../config/realms.ts'
import { median } from '../../lib/median.ts'
import type { Faction, Region } from '../../lib/search.ts'
import type { ItemResult, RealmPrice, RegionCell } from '../types.ts'

const ORDER: Region[] = ['us', 'eu', 'kr', 'tw']

export interface ItemArgs {
  region: Region
  itemId: number
  realm?: string
  faction?: Faction
}

interface RealmSql {
  realm: string
  faction: Faction
  updated_at: number | null
  day: number
  market_value: number
  min_buyout: number
  recent: number
  historical: number | null
}

const REALM_PRICE = `SELECT realm, faction, max(updated_at) AS updated_at, day, market_value, min_buyout, recent,
    NULLIF(historical, 0) AS historical
  FROM realm_snapshots
  WHERE region = ?1 AND realm = ?2 AND faction = ?3 AND item_id = ?4 AND updated_at >= ?5`

export const CURRENT_SQL = `SELECT day, market_value, historical, avg_sale_price, sale_rate, sold_per_day, updated_at
  FROM region_snapshots INDEXED BY region_snapshots_item
  WHERE item_id = ?1 AND region = ?2
    AND day >= (SELECT max(day) FROM region_snapshots WHERE region = ?2) - 89
  ORDER BY day DESC LIMIT 1`

const toRealmPrice = (r: RealmSql | undefined): RealmPrice | null =>
  r && r.updated_at != null
    ? {
        realm: r.realm,
        faction: r.faction,
        updatedAt: r.updated_at,
        day: r.day,
        mv: r.market_value,
        minBuyout: r.min_buyout,
        recent: r.recent,
        historical: r.historical,
      }
    : null

/**
 * One item in one region plus the cross-region strip and realm prices.
 * `realms` are the configured realms of the region (both factions each).
 */
export async function getItem(
  db: D1Database,
  { region, itemId, realm, faction }: ItemArgs,
  nowMs: number,
  realms: readonly RealmConfig[] = [],
): Promise<ItemResult> {
  const today = Math.floor(nowMs / 86_400_000)
  const since = Math.floor(nowMs / 1000) - 90 * 86_400
  const pairs = realms.flatMap((r) =>
    (['alliance', 'horde'] as const).map((f) => [r.slug, f] as const),
  )
  const [item, current, strip, ...realmRows] = await db.batch<
    Record<string, unknown>
  >([
    db.prepare('SELECT id, name FROM items WHERE id = ?1').bind(itemId),
    db.prepare(CURRENT_SQL).bind(itemId, region),
    // bare columns with max(): SQLite returns them from the max(day) row
    db
      .prepare(
        `SELECT region, max(day) AS day, market_value, historical, sold_per_day, updated_at
         FROM region_snapshots WHERE item_id = ?1 AND day >= ?2 - 89 GROUP BY region`,
      )
      .bind(itemId, today),
    ...pairs.map(([slug, f]) =>
      db.prepare(REALM_PRICE).bind(region, slug, f, itemId, since),
    ),
  ])

  const cur = current.results[0] as Record<string, number> | undefined
  const byRegion = new Map(
    (
      strip.results as {
        region: Region
        day: number
        market_value: number
        historical: number
        sold_per_day: number
        updated_at: number
      }[]
    ).map((r) => [r.region, r]),
  )
  const mid = median(
    [...byRegion.values()].map((r) => r.market_value).filter((v) => v > 0),
  )
  const listed = [...byRegion.values()].filter((r) => r.market_value > 0).length
  const regions = ORDER.map((code): RegionCell => {
    const r = byRegion.get(code)
    return {
      region: code,
      day: r?.day ?? null,
      mv: r?.market_value ?? null,
      hist: r?.historical ?? null,
      spd: r?.sold_per_day ?? null,
      updatedAt: r?.updated_at ?? null,
      index:
        r && mid && listed >= 2 && r.market_value > 0
          ? r.market_value / mid - 1
          : null,
    }
  })
  const allRealms = realmRows
    .map((r) => toRealmPrice(r.results[0] as unknown as RealmSql | undefined))
    .filter((r): r is RealmPrice => r !== null)
  const row = item.results[0] as { id: number; name: string } | undefined
  return {
    item: row ? { id: row.id, name: row.name } : null,
    current: cur
      ? {
          mv: cur.market_value,
          hist: cur.historical,
          asp: cur.avg_sale_price,
          saleRate: cur.sale_rate,
          spd: cur.sold_per_day,
          updatedAt: cur.updated_at,
          day: cur.day,
        }
      : null,
    lastSeenDay: cur?.day ?? null,
    regions,
    realm:
      allRealms.find((r) => r.realm === realm && r.faction === faction) ?? null,
    realms: allRealms,
  }
}
