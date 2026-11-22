import '@tanstack/react-start/server-only'
import { z } from 'zod'

// Ingest imports only relative .ts paths, zod and the server-only marker: the
// seed scripts run it under plain Node (DESIGN §3).

export const REGION_HEADER =
  'itemId,name,marketValue,historical,avgSalePrice,saleRate,soldPerDay,updatedAt'
export const REALM_HEADER =
  'itemId,name,marketValue,minBuyout,recent,historical,updatedAt'

/** Quote-aware CSV parser: names contain commas and "" escapes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') {
        i++
      }
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

const id = z.coerce.number().int().positive()
const price = z.coerce.number().int().min(0).lt(1e11)
const rate = z.coerce.number().finite().min(0)
// real files leave the name empty for about 4% of rows (checked 2026-11-22 on us and eu)
const name = z.string()
const iso = z.string().min(1)

export const RegionRow = z
  .tuple([id, name, price, price, price, rate, rate, iso])
  .transform(([itemId, n, mv, hist, asp, saleRate, spd, updatedAt]) => ({
    itemId,
    name: n,
    mv,
    hist,
    asp,
    saleRate,
    spd,
    updatedAt,
  }))
export type RegionRow = z.infer<typeof RegionRow>

export const RealmRow = z
  .tuple([id, name, price, price, price, price, iso])
  .transform(([itemId, n, mv, minBuyout, recent, hist, updatedAt]) => ({
    itemId,
    name: n,
    mv,
    minBuyout,
    recent,
    hist,
    updatedAt,
  }))
export type RealmRow = z.infer<typeof RealmRow>

export type ParsedFile<TRow> =
  | {
      ok: true
      rows: TRow[]
      updatedAt: number
      updatedAtIso: string
      bad: number
    }
  | { ok: false; reason: string }

const MIN_UPDATED_AT = Date.UTC(2024, 0, 1) / 1000

/** Header, per-row zod checks (>1% bad fails), one updatedAt in a plausible range. */
export function parseFile<TKind extends 'region' | 'realm'>(
  kind: TKind,
  text: string,
  nowSeconds: number,
): ParsedFile<TKind extends 'region' ? RegionRow : RealmRow> {
  type R = TKind extends 'region' ? RegionRow : RealmRow
  const [first, ...body] = parseCsv(text.replace(/^\uFEFF/, ''))
  const header = first as string[] | undefined
  const expected = kind === 'region' ? REGION_HEADER : REALM_HEADER
  if (header?.join(',') !== expected) {
    return {
      ok: false,
      reason: `unexpected header: ${header?.join(',').slice(0, 200) ?? '(empty file)'}`,
    }
  }
  if (body.length === 0) {
    return { ok: false, reason: 'no rows' }
  }
  const schema = kind === 'region' ? RegionRow : RealmRow
  const rows: R[] = []
  let bad = 0
  for (const cells of body) {
    const parsed = schema.safeParse(cells)
    if (parsed.success) {
      rows.push(parsed.data as R)
    } else {
      bad++
    }
  }
  if (bad / body.length > 0.01) {
    return {
      ok: false,
      reason: `${bad} of ${body.length} rows failed validation`,
    }
  }
  if (rows.length === 0) {
    return { ok: false, reason: 'no valid rows' }
  }
  const updatedAtIso = rows[0].updatedAt
  if (rows.some((r) => r.updatedAt !== updatedAtIso)) {
    return { ok: false, reason: 'rows carry different updatedAt values' }
  }
  const ms = Date.parse(updatedAtIso)
  if (Number.isNaN(ms)) {
    return { ok: false, reason: `unparseable updatedAt ${updatedAtIso}` }
  }
  const updatedAt = Math.floor(ms / 1000)
  if (updatedAt < MIN_UPDATED_AT || updatedAt > nowSeconds + 3600) {
    return { ok: false, reason: `implausible updatedAt ${updatedAtIso}` }
  }
  return { ok: true, rows, updatedAt, updatedAtIso, bad }
}
