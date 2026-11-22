// pnpm db:synth: dev-only fake history. For each region with a stored day D it
// writes days D-89 ... D-1 with INSERT OR IGNORE, so real rows always win.
// Writes nothing to R2. There is deliberately no remote path.
import { guardOrExit } from './guard.ts'
import { walkBack } from './synthetic.ts'
import type { RealRow } from './synthetic.ts'

guardOrExit()

const { getPlatformProxy } = await import('wrangler')

const CHUNK = 1_000
const proxy = await getPlatformProxy<Env>({ remoteBindings: false })
const db = proxy.env.DB

try {
  const latest = await db
    .prepare(
      `SELECT region, max(day) AS day FROM region_snapshots WHERE region IN ('us', 'eu', 'kr', 'tw') GROUP BY region`,
    )
    .all<{ region: string; day: number }>()
  for (const { region, day } of latest.results) {
    const real = await db
      .prepare(
        `SELECT item_id AS itemId, market_value AS mv, historical AS hist, avg_sale_price AS asp,
                sale_rate AS saleRate, sold_per_day AS spd, updated_at
         FROM region_snapshots WHERE region = ?1 AND day = ?2`,
      )
      .bind(region, day)
      .all<RealRow & { updated_at: number }>()
    const rows = real.results
    const timeOfDay = (rows[0]?.updated_at ?? day * 86_400) - day * 86_400
    const walks = rows.map((r) => walkBack(region, r, day))
    for (let k = 1; k <= 89; k++) {
      const d = day - k
      const updatedAt = d * 86_400 + timeOfDay
      const statements = [
        db
          .prepare(
            `INSERT INTO imports (region, kind, source_url, updated_at, fetched_at, rows, status, reason)
             SELECT ?1, 'region', ?2, ?3, ?3, ?4, 'imported', 'synthetic (dev only)'
             WHERE NOT EXISTS (SELECT 1 FROM imports WHERE region = ?1 AND kind = 'region'
                               AND status = 'imported' AND updated_at / 86400 = ?5)`,
          )
          .bind(
            region,
            `synthetic://forever/${region}/region/items.csv`,
            updatedAt,
            rows.length,
            d,
          ),
      ]
      for (let i = 0; i < walks.length; i += CHUNK) {
        const json = JSON.stringify(
          walks.slice(i, i + CHUNK).map((w) => {
            const r = w[k - 1]
            return [r.itemId, r.mv, r.hist, r.asp, r.saleRate, r.spd]
          }),
        )
        statements.push(
          db
            .prepare(
              `INSERT OR IGNORE INTO region_snapshots
                 (region, day, item_id, market_value, historical, avg_sale_price, sale_rate, sold_per_day, updated_at, import_id)
               SELECT ?1, ?2, json_extract(j.value, '$[0]'), json_extract(j.value, '$[1]'), json_extract(j.value, '$[2]'),
                      json_extract(j.value, '$[3]'), json_extract(j.value, '$[4]'), json_extract(j.value, '$[5]'), ?3,
                      (SELECT max(id) FROM imports WHERE region = ?1 AND updated_at / 86400 = ?2)
               FROM json_each(?4) AS j`,
            )
            .bind(region, d, updatedAt, json),
        )
      }
      await db.batch(statements)
    }
    console.log(
      `${region}: synthetic days ${day - 89} to ${day - 1} from ${rows.length} items`,
    )
  }
} finally {
  await proxy.dispose()
}
