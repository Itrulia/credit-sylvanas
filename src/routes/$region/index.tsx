import { Suspense } from 'react'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { HottestTable } from '#/components/market/hottest-table'
import { MarketMap } from '#/components/market/market-map'
import { MarketMapSkeleton } from '#/components/market/market-map-skeleton'
import { MoverBars } from '#/components/market/mover-bars'
import { Rising } from '#/components/market/rising-table'
import {
  mapMetric,
  probeInput,
  resolveWindow,
} from '#/components/market/market'
import { SectionBoundary } from '#/components/section-boundary'
import { REGION_INFO, regionLabel } from '#/config/regions'
import { dayOf } from '#/lib/format'
import { MARKET_DEFAULTS, marketSearch } from '#/lib/search'
import { pageHead } from '#/lib/seo'
import { m } from '#/paraglide/messages.js'
import { hottestQuery, moversQuery, risingQuery } from '#/server/fns/market'
import { regionStatusQuery } from '#/server/fns/status'

const HOT_LIMIT = 20

export const Route = createFileRoute('/$region/')({
  ssr: true,
  validateSearch: marketSearch,
  search: { middlewares: [stripSearchParams(MARKET_DEFAULTS)] },
  loaderDeps: ({ search }) => ({
    hot: search.hot,
    movers: search.movers,
    by: search.by,
  }),
  loader: async ({ context: { queryClient, region }, deps }) => {
    void queryClient.prefetchQuery(risingQuery({ region }))
    const [, probe] = await Promise.all([
      queryClient.ensureQueryData(
        hottestQuery({ region, by: deps.hot, limit: HOT_LIMIT }),
      ),
      queryClient.ensureQueryData(
        moversQuery(probeInput(region, deps.by, deps.movers)),
      ),
    ])
    const window = resolveWindow(deps.by, deps.movers, probe.available)
    if (window) {
      await Promise.all(
        ([1, -1] as const).map((dir) =>
          queryClient.ensureQueryData(
            moversQuery({ region, by: deps.by, metric: window, dir }),
          ),
        ),
      )
    }
  },
  head: ({ params }) => {
    const region = regionLabel(params.region)
    return pageHead(
      m.market_headTitle({ region }),
      m.market_headDescription({ region }),
    )
  },
  component: Market,
})

function Market() {
  const { region } = Route.useRouteContext()
  const { realm } = Route.useSearch()
  const { hot, movers, by } = Route.useLoaderDeps()
  const { data: status } = useSuspenseQuery(regionStatusQuery({ region }))
  const { data: hottest } = useSuspenseQuery(
    hottestQuery({ region, by: hot, limit: HOT_LIMIT }),
  )
  const { data: probe } = useSuspenseQuery(
    moversQuery(probeInput(region, by, movers)),
  )
  const { available } = probe
  const window = resolveWindow(by, movers, available)
  const name = REGION_INFO[region].name
  return (
    <div className="page-wrap space-y-8 py-6">
      <header className="space-y-1">
        <h1 className="text-display">{m.market_heading({ region: name })}</h1>
        {realm !== undefined && (
          <p className="text-sm text-muted-foreground">
            {m.market_regionWideNote()}
          </p>
        )}
      </header>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section aria-labelledby="hottest" className="space-y-3 lg:col-span-7">
          <h2 id="hottest" tabIndex={-1} className="text-title">
            {m.market_hottestHeading()}
          </h2>
          <HottestTable
            region={region}
            hot={hot}
            rows={hottest}
            showChange={available.d1}
          />
        </section>
        <section aria-labelledby="moves" className="space-y-3 lg:col-span-5">
          <h2 id="moves" tabIndex={-1} className="text-title">
            {m.market_movesHeading()}
          </h2>
          <MoverBars
            region={region}
            by={by}
            window={window}
            available={available}
            nextDay={
              status.fetchedAt !== null ? dayOf(status.fetchedAt) + 1 : null
            }
            days={status.days}
          />
        </section>
        <section aria-labelledby="rising" className="space-y-3 lg:col-span-7">
          <h2 id="rising" tabIndex={-1} className="text-title">
            {m.market_risingHeading()}
          </h2>
          <SectionBoundary headingId="rising">
            <Suspense
              fallback={
                <div
                  aria-busy="true"
                  className="h-64 rounded-md border bg-muted"
                >
                  <span className="sr-only">{m.market_risingLoading()}</span>
                </div>
              }
            >
              <Rising region={region} lastDay={status.lastDay} />
            </Suspense>
          </SectionBoundary>
        </section>
      </div>
      <section aria-labelledby="market-map" className="space-y-3">
        <h2 id="market-map" tabIndex={-1} className="text-title">
          {m.market_mapHeading()}
        </h2>
        {/* no loader prefetch on purpose: MarketMap's useSuspenseQuery starts the
            read during render, so the skeleton always flushes first and the map
            streams into the same response (a finished prefetch would skip it) */}
        <SectionBoundary headingId="market-map">
          <Suspense fallback={<MarketMapSkeleton />}>
            <MarketMap
              region={region}
              metric={mapMetric(by, window, available.d1)}
            />
          </Suspense>
        </SectionBoundary>
      </section>
    </div>
  )
}
