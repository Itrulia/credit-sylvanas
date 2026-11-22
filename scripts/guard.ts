import { readFileSync } from 'node:fs'
import { parseJsonc } from './jsonc.ts'

interface WranglerConfig {
  d1_databases?: { binding: string; remote?: boolean }[]
}

/**
 * Seed scripts write fake or local data. They must only ever reach the local
 * Miniflare stores, so refuse anything that could point them at production.
 */
export function assertLocalOnly(
  argv: readonly string[],
  env: Record<string, string | undefined>,
  wranglerText: string,
): void {
  if (argv.includes('--remote')) {
    throw new Error(
      'Refusing to run with --remote: seed scripts only touch local D1.',
    )
  }
  if (env.CI) {
    throw new Error(
      'Refusing to run with CI set: seed scripts are for local development only.',
    )
  }
  const config = parseJsonc(wranglerText) as WranglerConfig
  if (config.d1_databases?.some((d) => d.remote === true)) {
    throw new Error(
      'Refusing to run: a D1 binding in wrangler.jsonc has "remote": true.',
    )
  }
}

export function guardOrExit(configPath = 'wrangler.jsonc') {
  try {
    assertLocalOnly(
      process.argv.slice(2),
      process.env,
      readFileSync(configPath, 'utf8'),
    )
  } catch (e) {
    console.error(e instanceof Error ? e.message : e)
    process.exit(1)
  }
}
