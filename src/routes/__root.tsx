import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { SitePalette } from '#/components/search/site-palette'
import { SiteFooter } from '#/components/site-footer'
import { SiteHeader } from '#/components/site-header'
import { WowheadTooltips } from '#/components/wowhead-tooltips'
import { ICON_FONT_HREF, TEXT_FONTS_HREF } from '#/lib/icons'
import { canonicalLinks } from '#/lib/seo'
import appCss from '../styles.css?url'

// import.meta.env.DEV is replaced at build time, so the import below is dropped from production
const Devtools = import.meta.env.DEV
  ? lazy(() => import('#/components/devtools'))
  : () => null

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: ({ matches }) => {
      const canonical = canonicalLinks(matches.at(-1)?.pathname ?? '/')
      return {
        meta: [
          { charSet: 'utf-8' },
          { name: 'viewport', content: 'width=device-width, initial-scale=1' },
          { name: 'color-scheme', content: 'light' },
          ...canonical.meta,
        ],
        links: [
          ...canonical.links,
          { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
          {
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossOrigin: 'anonymous',
          },
          // text fonts swap, icons block (no flash of the "search" ligature word): separate stylesheets
          { rel: 'stylesheet', href: TEXT_FONTS_HREF },
          { rel: 'stylesheet', href: ICON_FONT_HREF },
          { rel: 'stylesheet', href: appCss },
        ],
      }
    },
    shellComponent: RootDocument,
  },
)

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <SitePalette>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <SiteFooter />
        </SitePalette>
        <WowheadTooltips />
        <Suspense>
          <Devtools />
        </Suspense>
        <Scripts />
      </body>
    </html>
  )
}
