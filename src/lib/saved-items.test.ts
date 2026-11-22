// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  favouriteItems,
  isFavourite,
  rememberRecent,
  recentItems,
  toggleFavourite,
} from './saved-items'

const item = (itemId: number, region: 'us' | 'eu' = 'us') => ({
  region,
  itemId,
  name: `Item ${itemId}`,
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('recent items', () => {
  it('keeps the last three, newest first, unique per region and item', () => {
    rememberRecent(item(1))
    rememberRecent(item(2))
    rememberRecent(item(1, 'eu'))
    rememberRecent(item(3))
    rememberRecent(item(2))
    expect(recentItems.read()).toEqual([item(2), item(3), item(1, 'eu')])
    expect(JSON.parse(localStorage.getItem('recent-items')!)).toHaveLength(3)
  })

  it('returns the same array until storage changes, for useSyncExternalStore', () => {
    rememberRecent(item(1))
    expect(recentItems.read()).toBe(recentItems.read())
  })

  it('tells subscribers about changes, including other tabs', () => {
    const listener = vi.fn()
    const off = recentItems.subscribe(listener)
    rememberRecent(item(1))
    window.dispatchEvent(new StorageEvent('storage', { key: 'recent-items' }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'other' }))
    expect(listener).toHaveBeenCalledTimes(2)
    off()
  })

  it('drops invalid JSON and invalid entries', () => {
    localStorage.setItem('recent-items', '{not json')
    expect(recentItems.read()).toEqual([])
    localStorage.setItem(
      'recent-items',
      JSON.stringify([
        item(1),
        { region: 'xx', itemId: 2, name: 'x' },
        { region: 'us', itemId: -1, name: 'x' },
        'junk',
        item(1),
        item(4),
      ]),
    )
    expect(recentItems.read()).toEqual([item(1), item(4)])
    localStorage.setItem('recent-items', '{"a":1}')
    expect(recentItems.read()).toEqual([])
  })

  it('works for the session when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(recentItems.read()).toEqual([])
    expect(() => rememberRecent(item(1))).not.toThrow()
    expect(recentItems.read()).toEqual([item(1)])
  })

  it('keeps working in memory when only writes fail (storage full, old Safari private mode)', async () => {
    vi.resetModules()
    const fresh = await import('./saved-items')
    localStorage.setItem('recent-items', JSON.stringify([item(9)]))
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    fresh.rememberRecent(item(1))
    expect(fresh.recentItems.read()).toEqual([item(1), item(9)])
    fresh.toggleFavourite(item(1))
    expect(fresh.favouriteItems.read()).toEqual([item(1)])
    window.dispatchEvent(new StorageEvent('storage', { key: 'recent-items' }))
    expect(fresh.recentItems.read()).toEqual([item(1), item(9)])
  })
})

describe('favourites', () => {
  it('toggles an item on and off', () => {
    toggleFavourite(item(1))
    toggleFavourite(item(2))
    expect(isFavourite(favouriteItems.read(), item(1))).toBe(true)
    expect(favouriteItems.read()).toEqual([item(2), item(1)])
    toggleFavourite(item(1))
    expect(favouriteItems.read()).toEqual([item(2)])
    expect(isFavourite(favouriteItems.read(), item(1))).toBe(false)
  })

  it('keeps 500 favourites, far above real use, and only then drops the oldest', () => {
    for (let id = 1; id <= 501; id++) {
      toggleFavourite(item(id))
    }
    const stored = favouriteItems.read()
    expect(stored).toHaveLength(500)
    expect(stored[0]).toEqual(item(501))
    expect(isFavourite(stored, item(2))).toBe(true)
    expect(isFavourite(stored, item(1))).toBe(false)
  })
})
