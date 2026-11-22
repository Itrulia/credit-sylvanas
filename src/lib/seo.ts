import { m } from '#/i18n'

export const SITE = 'Credit Sylvanas'
export const SITE_URL = 'https://credit-sylvanas.app'

/** Canonical and og:url for a path, always on the apex domain without the query. */
export function canonicalLinks(pathname: string) {
  const href = `${SITE_URL}${pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname}`
  return {
    links: [{ rel: 'canonical', href }],
    meta: [{ property: 'og:url', content: href }],
  }
}

/** Title in exactly one place per route: React 19 hoists <title> but keeps the first. */
export function pageHead(title: string, description?: string, noindex = false) {
  return {
    meta: [
      { title: m.shell.docTitle({ page: title, site: SITE }) },
      ...(description ? [{ name: 'description', content: description }] : []),
      ...(noindex ? [{ name: 'robots', content: 'noindex' }] : []),
    ],
  }
}
