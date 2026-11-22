import { m } from '#/paraglide/messages.js'

export const SITE = 'Credit Sylvanas'
export const SITE_URL = 'https://credit-sylvanas.app'

/** Canonical and og:url on the apex domain. The query is dropped except ?page past 1, which lists other items. */
export function canonicalLinks(pathname: string, page?: number) {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
  const href = `${SITE_URL}${path}${page && page > 1 ? `?page=${page}` : ''}`
  return {
    links: [{ rel: 'canonical', href }],
    meta: [{ property: 'og:url', content: href }],
  }
}

/** Title in exactly one place per route: React 19 hoists <title> but keeps the first. */
export function pageHead(title: string, description?: string, noindex = false) {
  return {
    meta: [
      { title: m.shell_docTitle({ page: title, site: SITE }) },
      // bare title: og:site_name in the root head carries the site name
      { property: 'og:title', content: title },
      ...(description
        ? [
            { name: 'description', content: description },
            { property: 'og:description', content: description },
          ]
        : []),
      ...(noindex ? [{ name: 'robots', content: 'noindex' }] : []),
    ],
  }
}

// '<' as \u003c keeps a name like "</script>" from closing the tag; JSON.parse reads it back
function ldScript(data: object) {
  return {
    type: 'application/ld+json',
    children: JSON.stringify(data).replace(/</g, '\\u003c'),
  }
}

/** WebSite markup for the home page: Google reads the site name from it. */
export const websiteLd = () =>
  ldScript({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE,
    url: `${SITE_URL}/`,
  })

export function breadcrumbLd(trail: Array<{ name: string; path: string }>) {
  return ldScript({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(({ name, path }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${SITE_URL}${path}`,
    })),
  })
}
