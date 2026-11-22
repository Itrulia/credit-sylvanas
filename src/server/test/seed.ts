import { env } from 'cloudflare:workers'

export interface SeedRow {
  id: number
  name?: string
  mv?: number
  hist?: number
  asp?: number
  saleRate?: number
  spd?: number
}

let nextImport = 1

/** Inserts one imported region file for `day` plus its snapshot and item rows. */
export async function seedDay(region: string, day: number, rows: SeedRow[]) {
  const db = env.DB
  const updatedAt = day * 86_400 + 3_600
  const imp = await db
    .prepare(
      `INSERT INTO imports (region, kind, source_url, updated_at, fetched_at, rows, sha256, status, etag, r2_key)
       VALUES (?1, 'region', ?2, ?3, ?4, ?5, ?6, 'imported', '"e"', 'k') RETURNING id`,
    )
    .bind(
      region,
      `https://x/${region}`,
      updatedAt,
      updatedAt + 60,
      rows.length,
      `abcdef0123456789${nextImport++}`,
    )
    .first<{ id: number }>()
  const stmts = rows.flatMap((r) => [
    db
      .prepare(
        `INSERT INTO items (id, name, first_seen, last_seen) VALUES (?1, coalesce(?2, 'Item ' || ?1), ?3, ?3)
         ON CONFLICT (id) DO UPDATE SET name = coalesce(?2, name), last_seen = max(last_seen, excluded.last_seen), first_seen = min(first_seen, excluded.first_seen)`,
      )
      .bind(r.id, r.name ?? null, day),
    db
      .prepare(
        `INSERT INTO region_snapshots VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
         ON CONFLICT DO UPDATE SET market_value = excluded.market_value`,
      )
      .bind(
        region,
        day,
        r.id,
        r.mv ?? 10_000,
        r.hist ?? 10_000,
        r.asp ?? 10_000,
        r.saleRate ?? 0.5,
        r.spd ?? 5,
        updatedAt,
        imp!.id,
      ),
  ])
  if (stmts.length) {
    await db.batch(stmts)
  }
  return imp!.id
}

export async function seedRealmScan(
  region: string,
  realm: string,
  faction: string,
  t: number,
  rows: {
    id: number
    mv: number
    minBuyout?: number
    recent?: number
    hist?: number
  }[],
) {
  const db = env.DB
  const imp = await db
    .prepare(
      `INSERT INTO imports (region, kind, realm, source_url, updated_at, fetched_at, rows, status)
       VALUES (?1, 'realm', ?2, 'https://x/realm', ?3, ?3, ?4, 'imported') RETURNING id`,
    )
    .bind(region, `${realm}-${faction}`, t, rows.length)
    .first<{ id: number }>()
  await db.batch(
    rows.map((r) =>
      db
        .prepare(
          'INSERT INTO realm_snapshots VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)',
        )
        .bind(
          region,
          realm,
          faction,
          r.id,
          t,
          Math.floor(t / 86_400),
          r.mv,
          r.minBuyout ?? r.mv,
          r.recent ?? r.mv,
          r.hist ?? 0,
          imp!.id,
        ),
    ),
  )
}
