import { describe, expect, it } from 'vitest'
import {
  SITE_URL,
  breadcrumbLd,
  canonicalLinks,
  pageHead,
  websiteLd,
} from './seo'

describe('canonicalLinks', () => {
  it('points canonical and og:url at the apex domain', () => {
    expect(SITE_URL).toBe('https://credit-sylvanas.app')
    expect(canonicalLinks('/us/items')).toEqual({
      links: [
        { rel: 'canonical', href: 'https://credit-sylvanas.app/us/items' },
      ],
      meta: [
        { property: 'og:url', content: 'https://credit-sylvanas.app/us/items' },
      ],
    })
  })

  it('drops the trailing slash an index route match carries, except at the root', () => {
    expect(canonicalLinks('/us/').links[0].href).toBe(
      'https://credit-sylvanas.app/us',
    )
    expect(canonicalLinks('/').links[0].href).toBe(
      'https://credit-sylvanas.app/',
    )
  })

  it('keeps ?page=N past page 1 and drops every other param', () => {
    expect(canonicalLinks('/eu/items', 1).links[0].href).toBe(
      'https://credit-sylvanas.app/eu/items',
    )
    expect(canonicalLinks('/eu/items', 3)).toEqual({
      links: [
        {
          rel: 'canonical',
          href: 'https://credit-sylvanas.app/eu/items?page=3',
        },
      ],
      meta: [
        {
          property: 'og:url',
          content: 'https://credit-sylvanas.app/eu/items?page=3',
        },
      ],
    })
    expect(canonicalLinks('/eu/items/', 2).links[0].href).toBe(
      'https://credit-sylvanas.app/eu/items?page=2',
    )
  })
})

describe('pageHead', () => {
  it('sets og:title to the bare page title and og:description to the description', () => {
    const { meta } = pageHead('EU item prices', 'Every EU item.')
    expect(meta).toContainEqual({
      property: 'og:title',
      content: 'EU item prices',
    })
    expect(meta).toContainEqual({
      property: 'og:description',
      content: 'Every EU item.',
    })
  })

  it('leaves og:description out without a description', () => {
    const { meta } = pageHead('Untitled')
    expect(
      meta.some((m) => 'property' in m && m.property === 'og:description'),
    ).toBe(false)
  })
})

describe('JSON-LD', () => {
  it('names the site in a WebSite block', () => {
    const { type, children } = websiteLd()
    expect(type).toBe('application/ld+json')
    expect(JSON.parse(children)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Credit Sylvanas',
      url: 'https://credit-sylvanas.app/',
    })
  })

  it('builds a BreadcrumbList with absolute URLs and positions 1..n', () => {
    const { children } = breadcrumbLd([
      { name: 'EU auction house', path: '/eu' },
      { name: 'Items', path: '/eu/items' },
      { name: 'Bad </script><b>', path: '/eu/items/1' },
    ])
    expect(children).not.toContain('</script>')
    expect(children).not.toContain('<')
    const ld = JSON.parse(children)
    expect(ld['@type']).toBe('BreadcrumbList')
    expect(ld.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'EU auction house',
        item: `${SITE_URL}/eu`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Items',
        item: `${SITE_URL}/eu/items`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Bad </script><b>',
        item: `${SITE_URL}/eu/items/1`,
      },
    ])
  })
})
