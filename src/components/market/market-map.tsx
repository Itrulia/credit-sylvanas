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
import { m } from '#/paraglide/messages.js'
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

// layout boxes; tiles are placed in percent, so the map stretches to any
// width. Phones get a portrait layout of their own (MAP_BOX is 3:4 below sm),
// so tiles keep their shape instead of being squashed out of a 2:1 layout.
const W = 1200
const H = 600
const PW = 600
const PH = 800
const pct = (v: number, of: number) => `${(v / of) * 100}%`

// binInk as static classes Tailwind can see
const inkClass = (bin: Bin | null) =>
  binInk(bin) === '--foreground' ? 'text-foreground' : 'text-card'

function listColumns(region: Region, metric: MapMetric): DataColumn<HotRow>[] {
  return [
    {
      id: 'item',
      header: m.market_itemHeader(),
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
      header: m.market_goldPerDayHeader(),
      cell: ({ row }) => (
        <Money copper={row.original.goldVolume} variant="compact" align />
      ),
      meta: { align: 'right' },
    },
    {
      id: 'mv',
      header: m.shell_glossaryMarketValueLabel(),
      cell: ({ row }) => (
        <Money copper={row.original.mv} variant="compact" align />
      ),
      meta: { align: 'right' },
    },
    metric === 'd1'
      ? {
          id: 'd1',
          header: m.market_changeHeader(),
          cell: ({ row }) => <Delta value={row.original.d1} />,
          meta: { align: 'right' },
        }
      : {
          id: 'vsHist',
          header: m.market_vsHistHeader(),
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
  const [rects, portrait] = useMemo(() => {
    const values = data.map((r) => r.goldVolume)
    return [squarify(values, W, H), squarify(values, PW, PH)]
  }, [data])
  const name = REGION_INFO[region].name
  const valueOf = (r: HotRow) => (metric === 'd1' ? r.d1 : r.vsHist)
  if (data.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-sm">
        {m.market_mapEmpty({ region: name })}
      </p>
    )
  }
  return (
    <div className="space-y-3">
      <p className="text-sm">
        {metric === 'd1' ? m.market_mapIntroD1() : m.market_mapIntroVsHist()}
      </p>
      <Button
        variant="outline"
        size="sm"
        aria-pressed={list}
        onClick={() => setList((v) => !v)}
        className="pointer-coarse:h-11"
      >
        {m.market_listView()}
      </Button>
      {list ? (
        <DataTable
          caption={m.market_mapListCaption({ n: data.length, region: name })}
          label={m.market_mapListLabel({ region: name })}
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
            const tall = portrait[i]
            const label = itemName(r.name, r.id)
            const signed =
              value === null ? '—' : formatPct(value, { decimals: 0 })
            return (
              <Link
                key={r.id}
                to="/$region/items/$itemId"
                params={{ region, itemId: String(r.id) }}
                tabIndex={-1}
                title={m.market_mapTileTitle({ name: label, change: signed })}
                className={cn(
                  'absolute top-(--pt) left-(--pl) h-(--ph) w-(--pw) overflow-hidden border border-card no-underline [container-type:size] hover:z-10 hover:outline-2 hover:outline-foreground sm:top-(--t) sm:left-(--l) sm:h-(--h) sm:w-(--w)',
                  bin === null && 'hatch',
                  inkClass(bin),
                )}
                style={
                  {
                    '--l': pct(rect.x, W),
                    '--t': pct(rect.y, H),
                    '--w': pct(rect.w, W),
                    '--h': pct(rect.h, H),
                    '--pl': pct(tall.x, PW),
                    '--pt': pct(tall.y, PH),
                    '--pw': pct(tall.w, PW),
                    '--ph': pct(tall.h, PH),
                    background: bin === null ? undefined : binFill(bin),
                  } as React.CSSProperties
                }
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
            ? [m.market_mapLegendFell(), m.market_mapLegendRose()]
            : [m.market_mapLegendCheaper(), m.market_mapLegendPricier()]
        }
      />
    </div>
  )
}
