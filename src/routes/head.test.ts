import { describe, expect, it, vi } from 'vitest'
import { Route as Root } from './__root'
import { Route as Market } from './$region/index'
import { Route as Items } from './$region/items/index'
import { Route as Heatmap } from './$region/heatmap'
import { Route as Realms } from './$region/realms'
import { Route as Item } from './$region/items/$itemId'

// vi.mock is hoisted: route modules import server fns, and head() never touches the D1 binding
vi.mock('cloudflare:workers', () => ({ env: {} }))

type Head = { meta?: Array<Partial<Record<string, string>>> }
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
      params: { region: 'us' },
      loaderData: { name: 'Arcanite Bar', mv: 10000, spd: 5 },
    })
    const text = (head.meta ?? []).map((m) => m.title ?? m.content).join(' ')
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
})
