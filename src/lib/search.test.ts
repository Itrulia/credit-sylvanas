import { describe, expect, it } from 'vitest'
import {
  contextSearch,
  heatmapSearch,
  itemSearch,
  itemsSearch,
  marketSearch,
  realmsSearch,
} from './search'

describe('search schemas', () => {
  it('heatmap n arrives as a number and falls back on junk', () => {
    expect(heatmapSearch.parse({ n: 50 }).n).toBe(50)
    expect(heatmapSearch.parse({ n: 7, sort: 'evil', metric: 'x' })).toEqual({
      n: 25,
      sort: 'volume',
      metric: 'index',
    })
    expect(heatmapSearch.parse({}).n).toBe(25)
  })

  it('item ranges fall back to defaults', () => {
    expect(itemSearch.parse({ mvRange: '1y', heatRange: 'x' })).toEqual({
      mvRange: '30d',
      cmpRange: '30d',
      heatRange: '90d',
      salesRange: '90d',
    })
    expect(itemSearch.parse({ mvRange: '7d' }).mvRange).toBe('7d')
  })

  it('context drops a bad faction but keeps the realm string', () => {
    expect(contextSearch.parse({ realm: 'x', faction: 'orc' })).toEqual({
      realm: 'x',
      faction: undefined,
    })
  })

  it('market and items fall back', () => {
    expect(marketSearch.parse({ hot: 'bogus', by: 'evil' })).toEqual({
      hot: 'gold',
      movers: 'vs_hist',
      by: 'price',
    })
    expect(itemsSearch.parse({ sort: 'evil', page: -3 })).toEqual({
      q: '',
      sort: 'soldPerDay',
      dir: 'desc',
      page: 1,
    })
    expect(itemsSearch.parse({ q: '  bar  ' }).q).toBe('bar')
    // the router parses a hand-typed ?q=999999 as a number
    expect(itemsSearch.parse({ q: 999999 }).q).toBe('999999')
  })

  it('items page stays inside what listItems accepts', () => {
    expect(itemsSearch.parse({ page: 10_000 }).page).toBe(10_000)
    expect(itemsSearch.parse({ page: 10_001 }).page).toBe(1)
  })

  it('realms ruleset falls back to all', () => {
    expect(realmsSearch.parse({ ruleset: 'xyz' }).ruleset).toBe('all')
  })
})
