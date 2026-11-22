import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { PageviewTracker } from '#/components/pageview-tracker'
import { RouteFocus } from '#/components/route-focus'
import { SitePalette } from '#/components/search/site-palette'
import { SiteFooter } from '#/components/site-footer'
import { SiteHeader } from '#/components/site-header'
import { WowheadTooltips } from '#/components/wowhead-tooltips'
import { canonicalLinks } from '#/lib/seo'
import sansFont from '@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2?url'
import displayFont from '@fontsource/newsreader/files/newsreader-latin-600-normal.woff2?url'
import appCss from '../styles.css?url'

// above-the-fold faces: body text, the wordmark and the header icons
const PRELOAD_FONTS = [
  sansFont,
  displayFont,
  '/fonts/material-symbols-outlined.woff2',
]

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
          { rel: 'describedby', type: 'text/plain', href: '/llms.txt' },
          ...PRELOAD_FONTS.map((href) => ({
            rel: 'preload',
            href,
            as: 'font',
            type: 'font/woff2',
            crossOrigin: 'anonymous' as const,
          })),
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
        <PageviewTracker />
        <RouteFocus />
        <Suspense>
          <Devtools />
        </Suspense>
        <Scripts />
      </body>
    </html>
  )
}
