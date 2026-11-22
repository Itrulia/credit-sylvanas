import { describe, expect, it } from 'vitest'
import { SITE_URL, canonicalLinks } from './seo'

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
