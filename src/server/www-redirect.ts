import { SITE_URL } from '#/lib/seo'

const WWW_HOST = `www.${new URL(SITE_URL).host}`

/** One canonical host: www.credit-sylvanas.app answers with a 301 to the apex. */
export function wwwRedirect(request: Request): Response | null {
  const url = new URL(request.url)
  if (url.host !== WWW_HOST) {
    return null
  }
  return Response.redirect(`${SITE_URL}${url.pathname}${url.search}`, 301)
}
