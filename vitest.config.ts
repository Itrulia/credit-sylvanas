import { defineConfig } from 'vitest/config'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin'

// Separate from vite.config.ts: the start/devtools/cloudflare plugins crash vitest.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        plugins: [
          // Miniflare is configured directly: wrangler.jsonc's main pulls in the Start entry
          cloudflareTest(async () => ({
            miniflare: {
              compatibilityDate: '2026-11-01',
              compatibilityFlags: ['nodejs_compat'],
              d1Databases: ['DB'],
              r2Buckets: ['ARCHIVE'],
              bindings: {
                TEST_MIGRATIONS: await readD1Migrations('migrations'),
              },
            },
          })),
        ],
        test: {
          name: 'server',
          include: ['src/server/**/*.test.ts'],
          setupFiles: ['src/server/test/apply-migrations.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'web',
          environment: 'node',
          include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
          exclude: ['src/server/**'],
        },
      },
    ],
  },
})
