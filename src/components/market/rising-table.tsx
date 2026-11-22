import { useSuspenseQuery } from '@tanstack/react-query'
import { DataTable } from '#/components/data-table'
import type { DataColumn } from '#/components/data-table'
import { Delta } from '#/components/delta'
import { Icon } from '#/components/icon'
import { InfoPopover } from '#/components/info-popover'
import { ItemLink } from '#/components/item-link'
import { Money } from '#/components/money'
import { REGION_INFO } from '#/config/regions'
import { m } from '#/paraglide/messages.js'
import { formatDate, formatNumber } from '#/lib/format'
import type { Region } from '#/lib/search'
import { risingQuery } from '#/server/fns/market'
import type { RisingRow } from '#/server/types'

/** earlier daily updates the 30-day sales baseline needs (rising.ts) */
const NEED = 14

const columns = (region: Region): DataColumn<RisingRow>[] => [
  {
    id: 'item',
    header: m.market_itemHeader(),
    cell: ({ row }) => (
      <ItemLink
        id={row.original.id}
        name={row.original.name}
        region={region}
        className="max-w-56 sm:max-w-80"
      />
    ),
    meta: { rowHeader: true, cellClassName: 'min-w-36' },
  },
  {
    id: 'mv',
    header: m.shell_glossaryMarketValueLabel(),
    cell: ({ row }) => (
      <Money copper={row.original.mv} variant="compact" align />
    ),
    meta: { align: 'right', info: 'marketValue' },
  },
  {
    id: 'change',
    header: m.market_risingChangeHeader(),
    cell: ({ row }) => <Delta value={row.original.change} />,
    meta: { align: 'right' },
  },
  {
    id: 'spd',
    header: m.market_soldPerDayHeader(),
    cell: ({ row }) => (
      <>
        {formatNumber(row.original.spd, 1)}
        <div className="text-micro text-muted-foreground">
          {m.market_risingLift({ lift: formatNumber(row.original.lift, 1) })}
        </div>
      </>
    ),
    meta: { align: 'right', info: 'soldPerDay' },
  },
]

export interface RisingTableProps {
  region: Region
  rows: RisingRow[]
  /** region days with snapshots in the 30 before the latest (rising.ts) */
  days: number
  lastDay: number | null
}

export function RisingTable({ region, rows, days, lastDay }: RisingTableProps) {
  const name = REGION_INFO[region].name
  return (
    <div className="space-y-3">
      <p className="text-sm">
        {m.market_risingIntro()} <InfoPopover term="rising" />
      </p>
      {rows.length > 0 ? (
        <DataTable
          caption={m.market_risingCaption({ n: rows.length, region: name })}
          captionHidden
          label={m.market_risingLabel({ region: name })}
          columns={columns(region)}
          data={rows}
          getRowId={(row) => String(row.id)}
        />
      ) : days < NEED ? (
        <div className="rounded-md border border-dashed p-4 text-sm">
          <p className="font-semibold">
            {lastDay !== null
              ? m.market_risingStartsOn({
                  date: formatDate(lastDay + NEED - days),
                  days,
                  need: NEED,
                })
              : m.market_risingStartsLater({ days, need: NEED })}
          </p>
          <p>{m.market_risingNeed({ need: NEED })}</p>
        </div>
      ) : (
        <p className="flex items-start gap-2 rounded-md border border-dashed p-4 text-sm">
          <Icon name="info" className="mt-0.5 text-muted-foreground" />
          <span>{m.market_risingEmpty({ region: name })}</span>
        </p>
      )}
    </div>
  )
}

/** Reads the streamed query; the route prefetches it without waiting. */
export function Rising(props: Omit<RisingTableProps, 'rows' | 'days'>) {
  const { data } = useSuspenseQuery(risingQuery({ region: props.region }))
  return <RisingTable {...props} rows={data.rows} days={data.days} />
}
