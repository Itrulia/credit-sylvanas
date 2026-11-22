import '@tanstack/react-start/server-only'
import { PAGE_SIZE } from '../../lib/search.ts'
import type { Faction, ItemSort, Region, SortDir } from '../../lib/search.ts'
import type { ListResult, ListRow } from '../types.ts'
import { tokenFilter } from './shared.ts'

// Sort expressions come from this whitelist, never from input.
const SORT: Record<ItemSort, string> = {
  name: 'i.name',
  marketValue: 's.market_value',
  historical: 's.historical',
  vsHist: '(s.market_value - s.historical) * 1.0 / NULLIF(s.historical, 0)',
  avgSalePrice: 's.avg_sale_price',
  soldPerDay: 's.sold_per_day',
  saleRate: 's.sale_rate',
  goldPerDay: 's.sold_per_day * s.avg_sale_price',
}

export interface ListArgs {
  region: Region
  q: string
  sort: ItemSort
  dir: SortDir
  page: number
  realm?: string
  faction?: Faction
}

export async function listItems(
  db: D1Database,
  args: ListArgs,
): Promise<ListResult> {
  const { region, q, sort, dir, page, realm, faction } = args
  const f = tokenFilter(q, 2)
  const withRealm = Boolean(realm && faction)
  const next = 2 + f.binds.length
  const realmJoin = withRealm
    ? `LEFT JOIN realm_snapshots r ON r.region = ?1 AND r.realm = ?${next} AND r.faction = ?${next + 1}
         AND r.item_id = s.item_id
         AND r.updated_at = (SELECT max(updated_at) FROM realm_snapshots
                             WHERE region = ?1 AND realm = ?${next} AND faction = ?${next + 1})`
    : ''
  const realmCols = withRealm
    ? ', r.market_value AS realm_mv, r.min_buyout'
    : ''
  const where = `s.region = ?1 AND s.day = (SELECT max(day) FROM region_snapshots WHERE region = ?1) AND ${f.sql}`
  const limitParam = next + (withRealm ? 2 : 0)
  // NULLs last in both directions
  const expr = SORT[sort]
  const order = `${expr} IS NULL, ${expr} ${dir === 'asc' ? 'ASC' : 'DESC'}, i.id`
  const realmBinds = withRealm ? [realm, faction] : []
  const [rows, total] = await db.batch<Record<string, number | string | null>>([
    db
      .prepare(
        `SELECT s.item_id, i.name, s.market_value, s.historical, s.avg_sale_price, s.sale_rate, s.sold_per_day,
                (s.market_value - s.historical) * 1.0 / NULLIF(s.historical, 0) AS vs_hist${realmCols}
         FROM region_snapshots s JOIN items i ON i.id = s.item_id ${realmJoin}
         WHERE ${where}
         ORDER BY ${order}
         LIMIT ?${limitParam} OFFSET ?${limitParam + 1}`,
      )
      .bind(
        region,
        ...f.binds,
        ...realmBinds,
        PAGE_SIZE,
        (page - 1) * PAGE_SIZE,
      ),
    db
      .prepare(
        `SELECT count(*) AS n FROM region_snapshots s JOIN items i ON i.id = s.item_id WHERE ${where}`,
      )
      .bind(region, ...f.binds),
  ])
  return {
    total: (total.results[0]?.n as number | undefined) ?? 0,
    rows: rows.results.map((r): ListRow => {
      const row: ListRow = {
        id: r.item_id as number,
        name: r.name as string,
        mv: r.market_value as number,
        hist: r.historical as number,
        vsHist: r.vs_hist as number | null,
        asp: r.avg_sale_price as number,
        saleRate: r.sale_rate as number,
        spd: r.sold_per_day as number,
      }
      if (withRealm) {
        row.realmMv = r.realm_mv as number | null
        row.minBuyout = r.min_buyout as number | null
      }
      return row
    }),
  }
}
