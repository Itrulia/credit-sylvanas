import { useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { DataTable } from '#/components/data-table'
import type { DataColumn } from '#/components/data-table'
import { Delta } from '#/components/delta'
import { DivergingLegend } from '#/components/diverging-legend'
import { ItemLink } from '#/components/item-link'
import { Money } from '#/components/money'
import { Button } from '#/components/ui/button'
import { REGION_INFO } from '#/config/regions'
import { binFill, binInk, binOf } from '#/lib/bins'
import type { Bin } from '#/lib/bins'
import { formatPct } from '#/lib/format'
import type { Region } from '#/lib/search'
import { cn } from '#/lib/utils'
import { itemName } from '#/lib/wowhead'
import { marketMapQuery } from '#/server/fns/market'
import type { HotRow } from '#/server/types'
import { mapSummary } from './market'
import type { MapMetric } from './market'
import { MAP_BOX } from './market-map-skeleton'
import { squarify } from './treemap'

// layout box; tiles are placed in percent, so the map stretches to any width
const W = 1200
const H = 600
const pct = (v: number, of: number) => `${(v / of) * 100}%`

// binInk per theme, as static classes Tailwind can see
const inkClass = (bin: Bin | null) =>
  binInk(bin, 'light') === '--foreground'
    ? 'text-foreground'
    : 'text-card dark:text-background'

function listColumns(region: Region, metric: MapMetric): DataColumn<HotRow>[] {
  return [
    {
      id: 'item',
      header: 'Item',
      cell: ({ row }) => (
        <ItemLink
          id={row.original.id}
          name={row.original.name}
          region={region}
        />
      ),
      meta: { rowHeader: true },
    },
    {
      id: 'goldVolume',
      header: 'Gold/day',
      cell: ({ row }) => (
        <Money copper={row.original.goldVolume} variant="compact" align />
      ),
      meta: { align: 'right' },
    },
    {
      id: 'mv',
      header: 'Market value',
      cell: ({ row }) => (
        <Money copper={row.original.mv} variant="compact" align />
      ),
      meta: { align: 'right' },
    },
    metric === 'd1'
      ? {
          id: 'd1',
          header: 'Change',
          cell: ({ row }) => <Delta value={row.original.d1} />,
          meta: { align: 'right' },
        }
      : {
          id: 'vsHist',
          header: 'vs 60-day avg',
          cell: ({ row }) => (
            <Delta value={row.original.vsHist} mode="vsHist" />
          ),
          meta: { align: 'right' },
        },
  ]
}

export interface MarketMapProps {
  region: Region
  metric: MapMetric
}

/** Treemap of the top 100 by gold per day. The List view is the keyboard and screen-reader path. */
export function MarketMap({ region, metric }: MarketMapProps) {
  const { data } = useSuspenseQuery(marketMapQuery({ region }))
  const [list, setList] = useState(false)
  const rects = useMemo(
    () =>
      squarify(
        data.map((r) => r.goldVolume),
        W,
        H,
      ),
    [data],
  )
  const name = REGION_INFO[region].name
  const valueOf = (r: HotRow) => (metric === 'd1' ? r.d1 : r.vsHist)
  if (data.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm">
        Not enough trading in {name} to draw a market map yet. Items need about
        one sale every two days to count.
      </p>
    )
  }
  return (
    <div className="space-y-3">
      <p className="text-sm">
        Tile size is gold traded per day. Colour is{' '}
        {metric === 'd1'
          ? 'the market value change since the previous daily update.'
          : "today's price against the 60-day average."}
      </p>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={list}
        onClick={() => setList((v) => !v)}
        className="pointer-coarse:h-11"
      >
        List view
      </Button>
      {list ? (
        <DataTable
          caption={`Top ${data.length} ${name} items by gold traded per day`}
          label={`Market map list, ${name}`}
          columns={listColumns(region, metric)}
          data={data}
          getRowId={(row) => String(row.id)}
        />
      ) : (
        <div
          role="img"
          aria-label={mapSummary(data.map(valueOf), metric)}
          className={cn(MAP_BOX, 'relative overflow-hidden rounded-md border')}
        >
          {data.map((r, i) => {
            const value = valueOf(r)
            const bin = binOf(value)
            const rect = rects[i]
            const label = itemName(r.name, r.id)
            const signed =
              value === null ? '—' : formatPct(value, { decimals: 0 })
            return (
              <Link
                key={r.id}
                to="/$region/items/$itemId"
                params={{ region, itemId: String(r.id) }}
                tabIndex={-1}
                title={`${label}, ${signed}`}
                className={cn(
                  'absolute overflow-hidden border border-card no-underline [container-type:size] hover:z-10 hover:outline-2 hover:outline-foreground',
                  bin === null && 'hatch',
                  inkClass(bin),
                )}
                style={{
                  left: pct(rect.x, W),
                  top: pct(rect.y, H),
                  width: pct(rect.w, W),
                  height: pct(rect.h, H),
                  background: bin === null ? undefined : binFill(bin),
                }}
              >
                <span className="hidden p-1 text-xs leading-tight font-semibold [@container(min-width:40px)_and_(min-height:18px)]:block">
                  <span className="line-clamp-2 break-words" data-tile-label="">
                    {label}
                  </span>
                  <span className="num hidden [@container(min-width:64px)_and_(min-height:32px)]:block">
                    {signed}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
      <DivergingLegend
        labels={
          metric === 'd1'
            ? ['Fell', 'Rose']
            : ['Cheaper than usual', 'Pricier than usual']
        }
      />
    </div>
  )
}
