import '@tanstack/react-start/server-only'
import type { HotRow } from '../types.ts'

export const LIQUID = `s.sold_per_day >= 0.5 AND s.sale_rate >= 0.05 AND s.avg_sale_price > 0
  AND s.avg_sale_price <= 5 * max(s.market_value, s.historical)`

export interface HotSql {
  item_id: number
  name: string
  market_value: number
  historical: number
  avg_sale_price: number
  sale_rate: number
  sold_per_day: number
  gold_volume: number
  vs_hist: number | null
  d1: number | null
}

export const toHotRow = (r: HotSql): HotRow => ({
  id: r.item_id,
  name: r.name,
  mv: r.market_value,
  hist: r.historical,
  asp: r.avg_sale_price,
  saleRate: r.sale_rate,
  spd: r.sold_per_day,
  goldVolume: r.gold_volume,
  vsHist: r.vs_hist,
  d1: r.d1,
})

/** UTC day number for a unix ms instant. */
export const dayFromMs = (ms: number) => Math.floor(ms / 86_400_000)

/**
 * Splits a search into <= 5 LIKE tokens with % _ \ escaped. An all-digit query
 * matches the id exactly instead.
 */
export function tokenFilter(q: string, firstParam: number) {
  const trimmed = q.trim()
  if (/^\d+$/.test(trimmed)) {
    return {
      sql: `i.id = ?${firstParam}`,
      binds: [Number(trimmed)],
      prefix: null,
    }
  }
  const tokens = trimmed.split(/\s+/).filter(Boolean).slice(0, 5)
  const esc = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`)
  if (tokens.length === 0) {
    return { sql: 'true', binds: [], prefix: null }
  }
  return {
    sql: tokens
      .map((_, i) => `i.name LIKE ?${firstParam + i} ESCAPE '\\'`)
      .join(' AND '),
    binds: tokens.map((t) => `%${esc(t)}%`),
    prefix: `${esc(trimmed)}%`,
  }
}
