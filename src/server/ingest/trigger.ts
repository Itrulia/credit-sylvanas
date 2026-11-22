import '@tanstack/react-start/server-only'
import { runJob } from './jobs.ts'
import type { IngestEnv } from './jobs.ts'

export const INGEST_PATH = '/__ingest'

const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

async function sameToken(given: string, expected: string) {
  // compare digests, so the time spent says nothing about the token or its length
  const enc = new TextEncoder()
  const [a, b] = await Promise.all(
    [given, expected].map(
      async (s) =>
        new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s))),
    ),
  )
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}

/**
 * `POST /__ingest?kind=region|realm` with `Authorization: Bearer
 * <INGEST_TOKEN>` runs the same job as the matching cron, with its ETag
 * check, archive and cache purge, so TSM is still fetched only by the
 * Worker's ingest. 404 while the secret is unset or for any other method.
 * Answers 200 with every file's result, failed ones included.
 */
export async function ingestTrigger(
  request: Request,
  env: IngestEnv & { INGEST_TOKEN?: string },
  ctx: Pick<ExecutionContext, 'waitUntil'>,
  run: typeof runJob = runJob,
): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== INGEST_PATH) {
    return null
  }
  if (!env.INGEST_TOKEN || request.method !== 'POST') {
    return new Response('Not found', { status: 404 })
  }
  const auth = request.headers.get('Authorization') ?? ''
  const given = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : ''
  if (!(await sameToken(given, env.INGEST_TOKEN))) {
    return json({ error: 'unauthorized' }, 401)
  }
  const kind = url.searchParams.get('kind') ?? 'region'
  if (kind !== 'region' && kind !== 'realm') {
    return json({ error: 'kind must be region or realm' }, 400)
  }
  try {
    const job = run(kind, Date.now(), env)
    // a caller that disconnects mid-run would otherwise cancel it between the
    // download and the imports row, and the next run would download again
    ctx.waitUntil(job.catch(() => undefined))
    return json({ results: await job }, 200)
  } catch (error) {
    console.error(error)
    return json(
      { error: error instanceof Error ? error.message : 'ingest failed' },
      500,
    )
  }
}
