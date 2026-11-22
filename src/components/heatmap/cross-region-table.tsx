import { useState } from 'react'
import { DataTable } from '#/components/data-table'
import type { DataColumn } from '#/components/data-table'
import { Delta } from '#/components/delta'
import { DivergingLegend } from '#/components/diverging-legend'
import { InfoPopover } from '#/components/info-popover'
import { ItemLink } from '#/components/item-link'
import { Money } from '#/components/money'
import { StatePanel } from '#/components/state-panel'
import { REGIONS, REGION_INFO } from '#/config/regions'
import { formatPct } from '#/lib/format'
import { sortHeatRows } from '#/lib/heatmap'
import type { HeatMetric, HeatSort, HeatmapN, Region } from '#/lib/search'
import { cn } from '#/lib/utils'
import type { HeatRow } from '#/server/types'
import { SORT_LABEL, heatCell, nextSort, sortAnnouncement } from './heat'

export interface CrossRegionTableProps {
  region: Region
  rows: HeatRow[]
  regionsWithData: readonly Region[]
  n: HeatmapN
  sort: HeatSort
  metric: HeatMetric
  onSort: (sort: HeatSort) => void
  busy?: boolean
}

const HEADING_ID = 'across-regions'
const cellBox = 'h-8 min-w-18 text-right'

function Missing({ text }: { text: string }) {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{text}</span>
    </>
  )
}

function regionColumn(
  r: Region,
  current: Region,
  hasData: boolean,
  metric: HeatMetric,
): DataColumn<HeatRow> {
  const name = REGION_INFO[r].name
  return {
    id: r,
    header: () => (
      <>
        {name}
        {r === current && <span className="sr-only"> (this region)</span>}
        {!hasData && <span className="normal-case"> (no data yet)</span>}
      </>
    ),
    meta: {
      align: 'right',
      headerClassName: cn(r === current && 'border-b-3 border-brand-tomato'),
      cellClassName: (row) =>
        cn(
          cellBox,
          heatCell(hasData ? (row.cells[r]?.index ?? null) : null).className,
        ),
      cellStyle: (row) =>
        heatCell(hasData ? (row.cells[r]?.index ?? null) : null).style ?? {},
    },
    cell: ({ row }) => {
      const cell = row.original.cells[r]
      if (!hasData) {
        return <Missing text={`No ${name} prices yet`} />
      }
      if (!cell) {
        return <Missing text={`Not listed in ${name}`} />
      }
      if (metric === 'price' || cell.index === null) {
        return <Money copper={cell.mv} variant="compact" />
      }
      return <Delta value={cell.index} mode="vsMedian" />
    },
  }
}

export function CrossRegionTable({
  region,
  rows,
  regionsWithData,
  n,
  sort,
  metric,
  onSort,
  busy,
}: CrossRegionTableProps) {
  const [announcement, setAnnouncement] = useState('')
  const name = REGION_INFO[region].name
  const count = Math.min(rows.length, n)

  if (regionsWithData.length < 2) {
    return (
      <section aria-labelledby={HEADING_ID} className="space-y-3">
        <h2 id={HEADING_ID} className="text-title">
          Across regions
        </h2>
        <StatePanel as="h3" title="Cross-region comparison needs two regions.">
          <p>
            Only {name} has prices so far. The other two heatmaps still work.
          </p>
        </StatePanel>
      </section>
    )
  }

  const columns: DataColumn<HeatRow>[] = [
    {
      id: 'name',
      header: 'Item',
      meta: { sortable: true, rowHeader: true },
      cell: ({ row }) => (
        <ItemLink
          id={row.original.id}
          name={row.original.name}
          region={region}
          className="line-clamp-2 min-w-36"
        />
      ),
    },
    ...REGIONS.map((r) =>
      regionColumn(r, region, regionsWithData.includes(r), metric),
    ),
    {
      id: 'spread',
      header: 'Spread',
      meta: { sortable: true, align: 'right' },
      cell: ({ row }) =>
        row.original.spread === null ? (
          <Missing text="Needs two regions" />
        ) : (
          formatPct(row.original.spread, { sign: false })
        ),
    },
  ]

  const top =
    rows.length < n
      ? `Top ${rows.length} items (only ${rows.length} pass the trading filter)`
      : `Top ${n} ${name} items`
  const caption = `${top}, market value in each region against the cross-region median. Sorted by ${SORT_LABEL[sort]}.`

  return (
    <section aria-labelledby={HEADING_ID} className="space-y-3">
      <h2 id={HEADING_ID} className="text-title">
        Across regions
      </h2>
      <p className="max-w-prose text-sm">
        Top {count} items by gold traded per day in {name}. Each cell compares
        that region's market value with the middle value of every region that
        lists it. Regions have separate economies, so a gap means scarce or
        plentiful there, not an exchange rate.
      </p>
      <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center">
          Cross-region index <InfoPopover term="index" />
        </span>
        <span className="inline-flex items-center">
          Spread <InfoPopover term="spread" />
        </span>
      </p>
      <DivergingLegend
        labels={['Cheaper than other regions', 'Pricier than other regions']}
      />
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <DataTable
        caption={caption}
        label="Across regions"
        columns={columns}
        data={sortHeatRows(rows, sort)}
        getRowId={(row) => String(row.id)}
        sort={
          sort === 'name'
            ? { id: 'name', dir: 'asc' }
            : sort === 'spread'
              ? { id: 'spread', dir: 'desc' }
              : undefined
        }
        onSort={(id) => {
          const next = nextSort(sort, id as HeatSort)
          setAnnouncement(sortAnnouncement(next))
          onSort(next)
        }}
        busy={busy}
        stickyFirstColumn
        className="[&_table]:border-separate [&_table]:border-spacing-0.5"
      />
    </section>
  )
}
