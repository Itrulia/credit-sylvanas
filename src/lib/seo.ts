export const SITE = 'Worgen of Booty Bay'

/** Title in exactly one place per route: React 19 hoists <title> but keeps the first. */
export function pageHead(title: string, description?: string, noindex = false) {
  return {
    meta: [
      { title: `${title} · ${SITE}` },
      ...(description ? [{ name: 'description', content: description }] : []),
      ...(noindex ? [{ name: 'robots', content: 'noindex' }] : []),
    ],
  }
}
