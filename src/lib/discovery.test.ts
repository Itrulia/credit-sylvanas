import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DISABLED_REGIONS, REGIONS } from '#/config/regions'
import { realmsFor } from '#/config/realms'
import { SITE_URL } from '#/lib/seo'

const read = (path: string) => readFileSync(path, 'utf8')

// route patterns from the generated tree, e.g. '/$region/items/$itemId'
const ROUTES = [
  ...read('src/routeTree.gen.ts').matchAll(/fullPath: '([^']+)'/g),
].map(([, path]) => (path.length > 1 ? path.replace(/\/$/, '') : path))

function routeExists(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  return ROUTES.some((route) => {
    const pattern = route.split('/').filter(Boolean)
    return (
      pattern.length === parts.length &&
      pattern.every((seg, i) =>
        seg === '$region'
          ? (REGIONS as readonly string[]).includes(parts[i])
          : seg.startsWith('$') || seg === parts[i],
      )
    )
  })
}

const LINK_LINE = /^- \[([^\]]+)\]\((https:\/\/[^)\s]+)\): (.+)$/

describe('llms.txt', () => {
  const text = read('public/llms.txt')
  const lines = text.split('\n')
  const links = lines.filter((l) => l.startsWith('- '))

  it('opens with the one H1 and a blockquote summary', () => {
    expect(lines[0]).toBe('# Credit Sylvanas')
    expect(lines.filter((l) => /^# /.test(l))).toHaveLength(1)
    expect(lines.find((l) => l.trim() !== '' && l !== lines[0])).toMatch(/^> /)
    expect(text).toMatch(/Last reviewed \d{4}-\d{2}-\d{2}/)
  })

  it('has no HTML, tables, images or nested lists', () => {
    expect(text).not.toMatch(/<[a-z]/i)
    expect(text).not.toMatch(/^\|/m)
    expect(text).not.toMatch(/!\[/)
    expect(text).not.toMatch(/^[ \t]+[-*] /m)
  })

  it('never names a disabled region, whose pages 404', () => {
    for (const { code } of DISABLED_REGIONS) {
      expect(text).not.toMatch(new RegExp(`\\b${code}\\b`))
    }
  })

  it('lists 10 to 30 well-formed canonical links to routes that exist', () => {
    expect(links.length).toBeGreaterThanOrEqual(10)
    expect(links.length).toBeLessThanOrEqual(30)
    for (const line of links) {
      const match = LINK_LINE.exec(line)
      expect(match, line).not.toBeNull()
      const [, , url, description] = match!
      expect(url.startsWith(`${SITE_URL}/`) || url === SITE_URL, url).toBe(true)
      expect(description.length, line).toBeLessThan(120)
      expect(routeExists(new URL(url).pathname), url).toBe(true)
    }
  })
})

describe('robots.txt and sitemap.xml', () => {
  it('robots.txt points at the sitemap and blocks nothing', () => {
    const robots = read('public/robots.txt')
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
    expect(robots).not.toMatch(/^Disallow: \S/m)
  })

  it('sitemap.xml lists the static pages and every region page, all real routes', () => {
    const locs = [
      ...read('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g),
    ].map(([, loc]) => new URL(loc).pathname)
    const expected = [
      '/',
      '/about',
      '/privacy',
      '/impressum',
      ...REGIONS.flatMap((r) => [
        `/${r}`,
        `/${r}/items`,
        `/${r}/heatmap`,
        // an empty realms page is noindex, so it joins the sitemap with its first realm
        ...(realmsFor(r).length > 0 ? [`/${r}/realms`] : []),
      ]),
    ]
    expect(locs.sort()).toEqual(expected.sort())
    expect(locs.every(routeExists)).toBe(true)
  })
})

describe('root head', () => {
  it('declares llms.txt with rel=describedby', () => {
    expect(read('src/routes/__root.tsx')).toMatch(
      /rel: 'describedby',\s+type: 'text\/plain',\s+href: '\/llms.txt'/,
    )
  })
})

describe('share image and favicons', () => {
  it('public/og.png is a 1200x630 PNG, the size og:image declares', () => {
    const png = readFileSync('public/og.png')
    expect(png.subarray(1, 4).toString()).toBe('PNG')
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
  })

  it('ships the favicons the root head links', () => {
    expect(read('public/favicon.svg')).toMatch(/^<svg /)
    const ico = readFileSync('public/favicon.ico')
    // ICO header (type 1, one image), then a 48x48 entry
    expect([ico.readUInt16LE(2), ico.readUInt16LE(4), ico[6], ico[7]]).toEqual([
      1, 1, 48, 48,
    ])
    const touch = readFileSync('public/apple-touch-icon.png')
    expect([touch.readUInt32BE(16), touch.readUInt32BE(20)]).toEqual([180, 180])
  })
})
