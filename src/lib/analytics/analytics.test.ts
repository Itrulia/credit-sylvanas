// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAnalytics } from './index.ts'
import type { AnalyticsProvider } from './index.ts'
import { noopProvider } from './noop.ts'
import { umamiProvider } from './umami.ts'

const fakeProvider = () => ({
  track: vi.fn<AnalyticsProvider['track']>(),
  pageview: vi.fn<AnalyticsProvider['pageview']>(),
})

describe('createAnalytics', () => {
  it('passes typed events and pageviews to the provider', () => {
    const provider = fakeProvider()
    const { track, trackPageview } = createAnalytics(provider)
    track('item_view', { itemId: 2589, region: 'eu' })
    track('palette_open')
    trackPageview('/eu')
    expect(provider.track.mock.calls).toEqual([
      ['item_view', { itemId: 2589, region: 'eu' }],
      ['palette_open', undefined],
    ])
    expect(provider.pageview).toHaveBeenCalledWith('/eu')
  })

  it('only accepts the closed event union with its props', () => {
    const { track } = createAnalytics(noopProvider)
    track('stats_range_change', { card: 'mv', range: '30d' })
    track('table_sort', { column: 'marketValue' })
    track('error_page', { status: 404 })
    // @ts-expect-error unknown event
    track('theme_change', { theme: 'dark' })
    // @ts-expect-error item_view needs its props
    track('item_view')
    // @ts-expect-error not a range
    track('stats_range_change', { card: 'mv', range: '1y' })
    // @ts-expect-error palette_open carries no props
    track('palette_open', { query: 'linen' })
    // @ts-expect-error region codes only
    track('region_switch', { region: 'cn' })
  })

  it('noop accepts every call without throwing', () => {
    expect(() => {
      noopProvider.track('palette_open')
      noopProvider.pageview('/')
    }).not.toThrow()
  })
})

describe('umamiProvider', () => {
  afterEach(() => {
    delete window.umami
    document.head.innerHTML = ''
  })

  const options = { websiteId: 'site-1', domain: 'credit-sylvanas.app' }

  it('calls window.umami once the script is there', () => {
    const umami = { track: vi.fn() }
    window.umami = umami
    const provider = umamiProvider(options)
    provider.track('item_view', { itemId: 1, region: 'us' })
    expect(umami.track.mock.calls).toEqual([
      ['item_view', { itemId: 1, region: 'us' }],
    ])
  })

  it('sends each pageview with its own path and title, not the landing page', () => {
    const umami = { track: vi.fn() }
    window.umami = umami
    const provider = umamiProvider(options)
    // the tracker captures url and title once at load; with auto-track off
    // nothing updates them, so a bare track() repeats the landing page
    const landing = { website: 'site-1', url: '/', title: 'Home' }
    document.title = 'EU prices'
    provider.pageview('/eu')
    document.title = 'EU items'
    provider.pageview('/eu/items')
    const sent = umami.track.mock.calls.map(([fn]) => fn(landing))
    expect(sent).toEqual([
      { website: 'site-1', url: '/eu', title: 'EU prices' },
      { website: 'site-1', url: '/eu/items', title: 'EU items' },
    ])
  })

  it('injects one cookieless, manual script and flushes calls made before it loaded', () => {
    const provider = umamiProvider(options)
    provider.pageview('/')
    provider.track('palette_open')
    const scripts = document.head.querySelectorAll('script')
    expect(scripts).toHaveLength(1)
    const script = scripts[0]
    expect(script.src).toBe('https://cloud.umami.is/script.js')
    expect({ ...script.dataset }).toEqual({
      websiteId: 'site-1',
      domains: 'credit-sylvanas.app',
      doNotTrack: 'true',
      autoTrack: 'false',
      excludeSearch: 'true',
      excludeHash: 'true',
    })
    const umami = { track: vi.fn() }
    window.umami = umami
    script.dispatchEvent(new Event('load'))
    expect(umami.track.mock.calls[1]).toEqual(['palette_open', undefined])
    expect(umami.track.mock.calls[0][0]).toBeTypeOf('function')
  })

  it('drops calls when the script is blocked', () => {
    const provider = umamiProvider(options)
    provider.pageview('/')
    document.head.querySelector('script')!.dispatchEvent(new Event('error'))
    provider.track('palette_open')
    expect(document.head.querySelectorAll('script')).toHaveLength(1)
  })
})
