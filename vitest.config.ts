import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts: the nitro/start/devtools plugins crash vitest.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { environment: 'node', passWithNoTests: true },
})
