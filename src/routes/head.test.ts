import { describe, expect, it, vi } from 'vitest'
import { Route as Root } from './__root'
import { Route as Home } from './index'
import { Route as Market } from './$region/index'
import { Route as Items } from './$region/items/index'
import { Route as Heatmap } from './$region/heatmap'
import { Route as Realms } from './$region/realms'
import { Route as Item } from './$region/items/$itemId'

// vi.mock is hoisted: route modules import server fns, and head() never touches the D1 binding
vi.mock('cloudflare:workers', () => ({ env: {} }))

type Head = {
  meta?: Array<Partial<Record<string, string>>>
  scripts?: Array<{ children?: string }>
}
const run = (route: { options: { head?: unknown } }, region: string) =>
  (route.options.head as (ctx: unknown) => Head)({ params: { region } })

describe('region page heads', () => {
  it.each([
    ['market', Market],
    ['items', Items],
    ['heatmap', Heatmap],
    ['realms', Realms],
  ])('%s says NA, never US, in title and description', (_, route) => {
    const meta = run(route, 'us').meta ?? []
    const title = meta.find((m) => m.title)?.title ?? ''
    const description =
      meta.find((m) => m.name === 'description')?.content ?? ''
    expect(title).toContain('NA')
    expect(title).not.toMatch(/\bUS\b/)
    expect(description).toContain('NA')
    expect(description).not.toMatch(/\bUS\b/)
  })

  it('item page says NA, never US', () => {
    const head = (Item.options.head as (ctx: unknown) => Head)({
      params: { region: 'us', itemId: '12360' },
      loaderData: { name: 'Arcanite Bar', mv: 10000, spd: 5 },
    })
    const text = (head.meta ?? []).map((m) => m.title ?? m.content).join(' ')
    const crumbs = JSON.parse(head.scripts?.[0]?.children ?? '{}')
    expect(crumbs.itemListElement.map((c: { name: string }) => c.name)).toEqual(
      ['NA auction house', 'Items', 'Arcanite Bar'],
    )
    expect(crumbs.itemListElement[2].item).toBe(
      'https://credit-sylvanas.app/us/items/12360',
    )
    expect(text).toContain('NA Forever')
    expect(text).not.toMatch(/\bUS\b/)
  })

  it('realms page is noindex while src/config/realms.ts is empty', () => {
    const meta = run(Realms, 'eu').meta ?? []
    expect(meta).toContainEqual({ name: 'robots', content: 'noindex' })
  })
})

describe('root head', () => {
  const rootHead = (search: unknown) =>
    (
      Root.options.head as (ctx: unknown) => {
        links?: Array<Partial<Record<string, string>>>
        meta?: Array<Partial<Record<string, string>>>
      }
    )({ matches: [{ pathname: '/eu/items', search }] })

  it('keeps the items page number in the canonical', () => {
    expect(rootHead({ page: 3, sort: 'name' }).links).toContainEqual({
      rel: 'canonical',
      href: 'https://credit-sylvanas.app/eu/items?page=3',
    })
    expect(rootHead({ page: 1 }).links).toContainEqual({
      rel: 'canonical',
      href: 'https://credit-sylvanas.app/eu/items',
    })
  })

  it('carries the site-wide share card and theme colour', () => {
    const meta = rootHead({}).meta
    expect(meta).toEqual(
      expect.arrayContaining([
        { name: 'theme-color', content: '#EDE4D3' },
        { property: 'og:site_name', content: 'Credit Sylvanas' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: 'https://credit-sylvanas.app/og.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ]),
    )
    expect(
      meta?.find((m) => m.property === 'og:image:alt')?.content,
    ).toBeTruthy()
  })

  it('links the favicons', () => {
    expect(rootHead({}).links).toEqual(
      expect.arrayContaining([
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ]),
    )
  })
})

it('home page names the site in WebSite JSON-LD', () => {
  const head = (Home.options.head as () => Head)()
  expect(JSON.parse(head.scripts?.[0]?.children ?? '{}')).toMatchObject({
    '@type': 'WebSite',
    name: 'Credit Sylvanas',
  })
})
