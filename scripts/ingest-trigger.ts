// Client for the Worker's POST /__ingest (src/server/ingest/trigger.ts).
// It never fetches TSM itself: the production Worker does, with its ETag check.

export interface TriggerResult {
  url: string
  status: 'imported' | 'skipped' | 'failed'
  rows: number
  reason: string | null
}

export async function triggerIngest({
  base,
  token,
  kind,
  fetchFn = fetch,
}: {
  base: string
  token: string
  kind: 'region' | 'realm'
  fetchFn?: (url: string, init: RequestInit) => Promise<Response>
}): Promise<TriggerResult[]> {
  const res = await fetchFn(`${base}/__ingest?kind=${kind}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = (await res.json().catch(() => ({}))) as {
    results?: TriggerResult[]
    error?: string
  }
  if (!res.ok || !body.results) {
    throw new Error(`HTTP ${res.status}: ${body.error ?? 'no results'}`)
  }
  return body.results
}

/** forever/eu/region/items.csv -> "eu region", forever/eu/realm/x-horde/items.csv -> "eu x-horde" */
const label = (url: string) => {
  const [, region, kind, realm] = new URL(url).pathname.split('/').slice(1)
  return `${region} ${kind === 'realm' ? realm : 'region'}`
}

export const formatResults = (results: TriggerResult[]) =>
  results
    .map(
      (r) =>
        `${r.status.padEnd(9)} ${label(r.url)}  ${r.rows} rows${r.reason ? `  (${r.reason})` : ''}`,
    )
    .join('\n')
