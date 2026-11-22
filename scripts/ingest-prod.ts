// pnpm ingest:prod [region|realm]: asks the production Worker to run that
// ingest job now. INGEST_TOKEN comes from .env.local or .env.prod (both
// gitignored); never .env, which is committed.
import { formatResults, triggerIngest } from './ingest-trigger.ts'

// not SITE_URL: src/lib/seo.ts pulls in Paraglide, which plain node can't load
const BASE = 'https://credit-sylvanas.app'
const kind = process.argv[2] ?? 'region'
const token = process.env.INGEST_TOKEN
if (kind !== 'region' && kind !== 'realm') {
  console.error('Usage: pnpm ingest:prod [region|realm]')
  process.exit(1)
}
if (!token) {
  console.error('INGEST_TOKEN is not set. Put it in .env.local or .env.prod.')
  process.exit(1)
}
try {
  const results = await triggerIngest({ base: BASE, token, kind })
  console.log(formatResults(results))
  // same rule as the cron: a missing file is normal for the bucket
  if (
    results.some((r) => r.status === 'failed' && r.reason !== 'no such file')
  ) {
    process.exitCode = 1
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
