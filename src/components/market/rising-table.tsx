import { useSuspenseQuery } from '@tanstack/react-query'
import { DataTable } from '#/components/data-table'
import type { DataColumn } from '#/components/data-table'
import { Delta } from '#/components/delta'
import { Icon } from '#/components/icon'
import { InfoPopover } from '#/components/info-popover'
import { ItemLink } from '#/components/item-link'
import { Money } from '#/components/money'
import { REGION_INFO } from '#/config/regions'
import { formatDate, formatNumber } from '#/lib/format'
import type { Region } from '#/lib/search'
import { risingQuery } from '#/server/fns/market'
import type { RisingRow } from '#/server/types'

/** earlier daily updates the 30-day sales baseline needs (rising.ts) */
const NEED = 14

const columns = (region: Region): DataColumn<RisingRow>[] => [
  {
    id: 'item',
    header: 'Item',
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
    header: 'Market value',
    cell: ({ row }) => (
      <Money copper={row.original.mv} variant="compact" align />
    ),
    meta: { align: 'right', info: 'marketValue' },
  },
  {
    id: 'change',
    header: '7 days',
    cell: ({ row }) => <Delta value={row.original.change} />,
    meta: { align: 'right' },
  },
  {
    id: 'spd',
    header: 'Sold/day',
    cell: ({ row }) => (
      <>
        {formatNumber(row.original.spd, 1)}
        <div className="text-micro text-muted-foreground">
          {formatNumber(row.original.lift, 1)}× usual
        </div>
      </>
    ),
    meta: { align: 'right', info: 'soldPerDay' },
  },
]

export interface RisingTableProps {
  region: Region
  rows: RisingRow[]
  /** distinct daily updates in the region, today included (status.days) */
  days: number
  lastDay: number | null
}

export function RisingTable({ region, rows, days, lastDay }: RisingTableProps) {
  const name = REGION_INFO[region].name
  const earlier = Math.max(0, days - 1)
  return (
    <div className="space-y-3">
      <p className="text-sm">
        Up at least 5% in a week and selling at least 1.25 times their usual
        amount per day. <InfoPopover term="rising" />
      </p>
      {earlier < NEED ? (
        <div className="rounded-md border border-dashed p-4 text-sm">
          <p className="font-semibold">
            Starts on{' '}
            {lastDay !== null
              ? formatDate(lastDay + NEED - earlier)
              : 'the 15th daily update'}{' '}
            ({earlier} of {NEED} days so far).
          </p>
          <p>Sales need {NEED} earlier daily updates to compare with.</p>
        </div>
      ) : rows.length === 0 ? (
        <p className="flex items-start gap-2 rounded-md border border-dashed p-4 text-sm">
          <Icon name="info" className="mt-0.5 text-muted-foreground" />
          <span>
            No item is rising with demand today. Nothing in {name} is up 5% on
            the week while also selling more than usual.
          </span>
        </p>
      ) : (
        <DataTable
          caption={`Top ${rows.length} ${name} items rising in price while selling more than usual`}
          captionHidden
          label={`${name} items rising with demand`}
          columns={columns(region)}
          data={rows}
          getRowId={(row) => String(row.id)}
        />
      )}
    </div>
  )
}

/** Reads the streamed query; the route prefetches it without waiting. */
export function Rising(props: Omit<RisingTableProps, 'rows'>) {
  const { data } = useSuspenseQuery(risingQuery({ region: props.region }))
  return <RisingTable {...props} rows={data} />
}
