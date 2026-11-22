import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ICON_FONT_HREF, ICON_NAMES } from './icons'

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
    expect(ICON_FONT_HREF).toContain(`icon_names=${ICON_NAMES.join(',')}`)
  })

  it('has no SVG icon library left anywhere', () => {
    expect(readFileSync('package.json', 'utf8')).not.toContain(banned)
    const hits = walk('src').filter((f) =>
      readFileSync(f, 'utf8').includes(banned),
    )
    expect(hits).toEqual([])
  })
})
