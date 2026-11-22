import { readFileSync, readdirSync } from 'node:fs'
import { expect, it } from 'vitest'

// Tailwind v4's default `dark:` variant follows prefers-color-scheme, so a stray one would quietly theme the site.
it('ships one light theme and no dark variants', () => {
  const css = readFileSync('src/styles.css', 'utf8')
  expect(css).toMatch(/:root\s*{\s*color-scheme: light;/)
  expect(css).not.toMatch(/\.dark\b|prefers-color-scheme|@custom-variant dark/)
  const offenders = readdirSync('src', { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts'))
    .filter((f) => /\bdark:/.test(readFileSync(`src/${f}`, 'utf8')))
  expect(offenders).toEqual([])
})
