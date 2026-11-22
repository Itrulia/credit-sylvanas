// pnpm db:seed [dir]: loads TSM CSVs already on disk into local D1 and R2
// through the real runIngest. Never downloads anything.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { guardOrExit } from './guard.ts'

guardOrExit()

const { getPlatformProxy } = await import('wrangler')
const { runIngest } = await import('../src/server/ingest/ingest.ts')

const dir = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? '.seed'

/** forever/{region}/region/items.csv -> {dir}/forever_{region}_region_items.csv, realm files likewise. */
export function localPath(url: string) {
  const path = new URL(url).pathname.slice(1)
  const region = /^forever\/(\w+)\/region\/items\.csv$/.exec(path)
  if (region) {
    return join(dir, `forever_${region[1]}_region_items.csv`)
  }
  const realm = /^forever\/(\w+)\/realm\/([\w-]+)\/items\.csv$/.exec(path)
  return realm ? join(dir, `forever_${realm[1]}_${realm[2]}_items.csv`) : null
}

const localFetch = async (url: string) => {
  const file = localPath(url)
  try {
    return new Response(file ? await readFile(file, 'utf8') : null, {
      status: file ? 200 : 404,
    })
  } catch {
    return new Response('not found', { status: 404 })
  }
}

const proxy = await getPlatformProxy<Env>({ remoteBindings: false })
try {
  for (const kind of ['region', 'realm'] as const) {
    const results = await runIngest(
      proxy.env.DB,
      proxy.env.ARCHIVE,
      localFetch,
      { kind, now: Date.now() },
    )
    for (const r of results) {
      console.log(
        `${r.status.padEnd(8)} ${r.url} ${r.rows} rows${r.reason ? ` (${r.reason})` : ''}`,
      )
    }
  }
} finally {
  await proxy.dispose()
}
