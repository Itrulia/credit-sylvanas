import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { SectionBoundary } from '#/components/section-boundary'
import { Skeleton } from '#/components/ui/skeleton'
import { m } from '#/i18n'
import { track } from '#/lib/analytics'
import type { StatRange } from '#/lib/search'
import { itemHistoryQuery } from '#/server/fns/item'
import type { ItemInput } from '#/server/fns/inputs'
import { CHART_HEIGHT } from './chart-parts'
import { HeatmapCard } from './dot-heatmap'
import { RegionCompareCard } from './region-compare-card'
import { ValueQuantityCard } from './value-quantity-card'

const FROM = '/$region/items/$itemId'
type Card = 'mv' | 'cmp' | 'heat' | 'sales'
const CARDS = [
  m.item.valueTitle(),
  m.item.compareRegionsTitle(),
  m.item.heatmapValueTitle(),
  m.item.heatmapSalesTitle(),
]

export interface StatsGridProps {
  input: ItemInput
  /** display name of the selected realm, when one is set */
  realmName: string | null
}

/** H2 "Statistics" and the 2×2 card grid, streamed in under its own boundary. */
export function StatsGrid({ input, realmName }: StatsGridProps) {
  return (
    <section aria-labelledby="stats-heading" className="mt-8">
      <h2 id="stats-heading" tabIndex={-1} className="text-title">
        {m.item.statsHeading()}
      </h2>
      <div className="mt-3">
        <SectionBoundary headingId="stats-heading">
          <Suspense fallback={<StatsSkeleton />}>
            <Cards input={input} realmName={realmName} />
          </Suspense>
        </SectionBoundary>
      </div>
    </section>
  )
}

function Cards({ input, realmName }: StatsGridProps) {
  const { data } = useSuspenseQuery(itemHistoryQuery(input))
  const search = useSearch({ from: FROM })
  const navigate = useNavigate({ from: FROM })
  // ranges filter the 90-day payload in render: a change never refetches
  const setter = (card: Card) => (range: StatRange) => {
    track('stats_range_change', { card, range })
    void navigate({
      search: (prev) => ({ ...prev, [`${card}Range`]: range }),
      replace: true,
      resetScroll: false,
    })
  }
  const realm = realmName ? data.realm : null
  const shared = { realm, realmName, region: input.region }
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ValueQuantityCard
        {...shared}
        points={data.points}
        range={search.mvRange}
        onRangeChange={setter('mv')}
      />
      <RegionCompareCard
        {...shared}
        points={data.points}
        others={data.others}
        range={search.cmpRange}
        onRangeChange={setter('cmp')}
      />
      <HeatmapCard
        {...shared}
        kind="value"
        points={data.points}
        range={search.heatRange}
        onRangeChange={setter('heat')}
      />
      <HeatmapCard
        {...shared}
        kind="sales"
        points={data.points}
        range={search.salesRange}
        onRangeChange={setter('sales')}
      />
    </div>
  )
}

/** Four cards at their final size, static (no shimmer). */
function StatsSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <p className="sr-only">{m.item.statsLoading()}</p>
      {CARDS.map((title) => (
        <div
          key={title}
          aria-hidden="true"
          className="flex flex-col gap-3 rounded-md border bg-card p-4"
        >
          <p className="text-base font-semibold">{title}</p>
          <Skeleton
            className="w-full rounded-md bg-muted"
            style={{ height: CHART_HEIGHT + 80 }}
          />
        </div>
      ))}
    </div>
  )
}
