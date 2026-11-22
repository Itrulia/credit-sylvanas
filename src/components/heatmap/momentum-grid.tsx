import { Delta } from '#/components/delta'
import { DivergingLegend } from '#/components/diverging-legend'
import { ItemLink } from '#/components/item-link'
import { REGION_INFO } from '#/config/regions'
import type { Region } from '#/lib/search'
import { cn } from '#/lib/utils'
import type { HeatRow } from '#/server/types'
import { byVsHist, heatCell, momentumSummary } from './heat'

export interface MomentumGridProps {
  region: Region
  rows: HeatRow[]
  busy?: boolean
}

const HEADING_ID = 'against-average'

/** Today's market value against each item's own 60-day average, as equal tiles. */
export function MomentumGrid({ region, rows, busy }: MomentumGridProps) {
  return (
    <section aria-labelledby={HEADING_ID} className="space-y-3">
      <h2 id={HEADING_ID} className="text-title">
        Against the 60-day average
      </h2>
      <p className="max-w-prose text-sm">
        Today's market value against each item's own 60-day average in{' '}
        {REGION_INFO[region].name}. Pricier first.
      </p>
      <DivergingLegend labels={['Cheaper than usual', 'Pricier than usual']} />
      <figure
        aria-busy={busy || undefined}
        className={cn(busy && 'opacity-60')}
      >
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-0.5">
          {byVsHist(rows).map((row) => {
            const cell = heatCell(row.vsHist)
            return (
              <li
                key={row.id}
                style={cell.style}
                className={cn(
                  cell.className,
                  'flex min-h-16 flex-col justify-between gap-1 rounded-sm p-2 text-sm hover:outline-2 hover:outline-ring focus-within:outline-2 focus-within:outline-ring',
                )}
              >
                <ItemLink
                  id={row.id}
                  name={row.name}
                  region={region}
                  className="line-clamp-2 font-medium"
                />
                <Delta value={row.vsHist} mode="vsHist" />
              </li>
            )
          })}
        </ol>
        <figcaption className="mt-2 text-sm text-muted-foreground">
          {momentumSummary(rows)}
        </figcaption>
      </figure>
    </section>
  )
}
