import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { REALM_CRON, REGION_CRON } from '../src/server/ingest/jobs.ts'
import { parseJsonc } from './jsonc.ts'

interface Config {
  main: string
  triggers: { crons: string[] }
  d1_databases: { binding: string; database_name: string }[]
  r2_buckets: { binding: string; bucket_name: string }[]
}

const config = parseJsonc(readFileSync('wrangler.jsonc', 'utf8')) as Config

it('declares both cron constants exactly', () => {
  expect(config.triggers.crons).toContain(REGION_CRON)
  expect(config.triggers.crons).toContain(REALM_CRON)
  expect(config.triggers.crons).toHaveLength(2)
})

it('binds DB and ARCHIVE and points main at the custom entry', () => {
  expect(config.main).toBe('src/server.ts')
  expect(config.d1_databases).toEqual([
    expect.objectContaining({ binding: 'DB', database_name: 'credit-sylvanas-prices' }),
  ])
  expect(config.r2_buckets).toEqual([
    { binding: 'ARCHIVE', bucket_name: 'credit-sylvanas-tsm-archive' },
  ])
})
