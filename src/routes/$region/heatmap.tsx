import {
  Link,
  createFileRoute,
  stripSearchParams,
  useRouterState,
} from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { DivergingLegend } from '#/components/diverging-legend'
import { CrossRegionTable } from '#/components/heatmap/cross-region-table'
import { DailyChangeSection } from '#/components/heatmap/daily-change-section'
import { HeatmapControls } from '#/components/heatmap/heatmap-controls'
import { MomentumGrid } from '#/components/heatmap/momentum-grid'
import { SectionBoundary } from '#/components/section-boundary'
import { StatePanel } from '#/components/state-panel'
import { REGION_INFO } from '#/config/regions'
import { m } from '#/i18n'
import { track } from '#/lib/analytics'
import { HEATMAP_DEFAULTS, heatmapSearch } from '#/lib/search'
import { pageHead } from '#/lib/seo'
import { dailyChangeQuery, heatmapQuery } from '#/server/fns/heatmap'

export const Route = createFileRoute('/$region/heatmap')({
  ssr: true,
  validateSearch: heatmapSearch,
  search: { middlewares: [stripSearchParams(HEATMAP_DEFAULTS)] },
  // sort and metric are applied in render and never refetch
  loaderDeps: ({ search }) => ({ n: search.n }),
  loader: async ({ context, deps }) => {
    const input = { region: context.region, n: deps.n }
    // the day-by-day table is the largest payload and below the fold: stream it
    void context.queryClient.prefetchQuery(dailyChangeQuery(input))
    await context.queryClient.ensureQueryData(heatmapQuery(input))
  },
  head: ({ params }) => {
    const name = params.region.toUpperCase()
    return pageHead(
      m.heatmap.headTitle({ region: name }),
      m.heatmap.headDescription({ region: name }),
    )
  },
  component: Heatmaps,
})

function Heatmaps() {
  const { region } = Route.useRouteContext()
  const { n, sort, metric, realm } = Route.useSearch()
  const navigate = Route.useNavigate()
  // a new n keeps the old tables on screen, dimmed, until the loader finishes
  const busy = useRouterState({ select: (s) => s.isLoading })
  const { data } = useSuspenseQuery(heatmapQuery({ region, n }))
  const name = REGION_INFO[region].name

  return (
    <div className="page-wrap space-y-8 py-6">
      <header className="space-y-1">
        <h1 className="text-display">{m.heatmap.pageTitle()}</h1>
        {realm !== undefined && (
          <p className="text-sm text-muted-foreground">
            {m.heatmap.realmNote()}
          </p>
        )}
      </header>

      <HeatmapControls
        n={n}
        metric={metric}
        onN={(next) =>
          navigate({ search: (prev) => ({ ...prev, n: next }), replace: true })
        }
        onMetric={(next) => {
          track('heatmap_metric_change', { metric: next })
          void navigate({
            search: (prev) => ({ ...prev, metric: next }),
            replace: true,
          })
        }}
      />

      {data.rows.length === 0 ? (
        <StatePanel
          title={m.heatmap.emptyTitle({ region: name })}
          actions={
            <Link to="/$region/items" params={{ region }} className="underline">
              {m.heatmap.emptyLink()}
            </Link>
          }
        >
          <p>{m.heatmap.emptyBody()}</p>
        </StatePanel>
      ) : (
        <>
          <CrossRegionTable
            region={region}
            rows={data.rows}
            regionsWithData={data.regionsWithData}
            n={n}
            sort={sort}
            metric={metric}
            busy={busy}
            onSort={(next) => {
              track('table_sort', { column: next })
              void navigate({
                search: (prev) => ({ ...prev, sort: next }),
                replace: true,
                resetScroll: false,
              })
            }}
          />
          <MomentumGrid region={region} rows={data.rows} busy={busy} />
          <section aria-labelledby="day-by-day" className="space-y-3">
            <h2 id="day-by-day" className="text-title" tabIndex={-1}>
              {m.heatmap.dailyTitle()}
            </h2>
            <p className="max-w-prose text-sm">{m.heatmap.dailyIntro()}</p>
            <DivergingLegend
              labels={[
                m.heatmap.dailyLegendFell(),
                m.heatmap.dailyLegendRose(),
              ]}
            />
            <SectionBoundary headingId="day-by-day">
              <DailyChangeSection region={region} n={n} busy={busy} />
            </SectionBoundary>
          </section>
        </>
      )}
    </div>
  )
}
