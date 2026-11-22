import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import manifest from '../../scripts/icon-font.manifest.json'
import { ICON_NAMES } from './icons'

const banned = ['lucide', 'react'].join('-')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

describe('icons', () => {
  it('keeps ICON_NAMES sorted and unique', () => {
    expect([...ICON_NAMES]).toEqual([...new Set(ICON_NAMES)].sort())
  })

  it('has a self-hosted icon font subset built from ICON_NAMES (run scripts/fetch-icon-font.ts)', () => {
    expect(manifest.iconNames).toEqual([...ICON_NAMES])
    expect(existsSync(`public/fonts/${manifest.file}`)).toBe(true)
  })

  it('never loads fonts from Google at runtime', () => {
    const hits = walk('src').filter((f) =>
      /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(f, 'utf8')),
    )
    expect(hits).toEqual([])
  })

  it('has no SVG icon library left anywhere', () => {
    expect(readFileSync('package.json', 'utf8')).not.toContain(banned)
    const hits = walk('src').filter((f) =>
      readFileSync(f, 'utf8').includes(banned),
    )
    expect(hits).toEqual([])
  })
})
