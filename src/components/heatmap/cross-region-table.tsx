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
import { m } from '#/i18n'
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
        {r === current && (
          <span className="sr-only"> {m.heatmap.regionCurrent()}</span>
        )}
        {!hasData && (
          <span className="normal-case"> {m.heatmap.regionNoData()}</span>
        )}
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
        return <Missing text={m.heatmap.cellNoPrices({ region: name })} />
      }
      if (!cell) {
        return <Missing text={m.heatmap.cellNotListed({ region: name })} />
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
          {m.heatmap.acrossTitle()}
        </h2>
        <StatePanel as="h3" title={m.heatmap.acrossNeedsTwoTitle()}>
          <p>{m.heatmap.acrossNeedsTwoBody({ region: name })}</p>
        </StatePanel>
      </section>
    )
  }

  const columns: DataColumn<HeatRow>[] = [
    {
      id: 'name',
      header: m.heatmap.itemColumn(),
      meta: { sortable: true, rowHeader: true },
      cell: ({ row }) => (
        <ItemLink
          id={row.original.id}
          name={row.original.name}
          region={region}
          className="max-w-56 min-w-36 sm:max-w-80"
        />
      ),
    },
    ...REGIONS.map((r) =>
      regionColumn(r, region, regionsWithData.includes(r), metric),
    ),
    {
      id: 'spread',
      header: m.heatmap.spreadLabel(),
      meta: { sortable: true, align: 'right' },
      cell: ({ row }) =>
        row.original.spread === null ? (
          <Missing text={m.heatmap.cellNoSpread()} />
        ) : (
          formatPct(row.original.spread, { sign: false })
        ),
    },
  ]

  const sortLabel = SORT_LABEL[sort]()
  const caption =
    rows.length < n
      ? m.heatmap.acrossCaptionFiltered({ count: rows.length, sort: sortLabel })
      : m.heatmap.acrossCaption({ n, region: name, sort: sortLabel })

  return (
    <section aria-labelledby={HEADING_ID} className="space-y-3">
      <h2 id={HEADING_ID} className="text-title">
        {m.heatmap.acrossTitle()}
      </h2>
      <p className="max-w-prose text-sm">
        {m.heatmap.acrossIntro({ count, region: name })}
      </p>
      <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center">
          {m.heatmap.metricIndex()} <InfoPopover term="index" />
        </span>
        <span className="inline-flex items-center">
          {m.heatmap.spreadLabel()} <InfoPopover term="spread" />
        </span>
      </p>
      <DivergingLegend
        labels={[
          m.heatmap.acrossLegendCheaper(),
          m.heatmap.acrossLegendPricier(),
        ]}
      />
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <DataTable
        caption={caption}
        label={m.heatmap.acrossTitle()}
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
