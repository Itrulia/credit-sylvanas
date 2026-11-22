import { DataTable } from '#/components/data-table'
import type { DataColumn } from '#/components/data-table'
import { Delta } from '#/components/delta'
import { ItemLink } from '#/components/item-link'
import { StatePanel } from '#/components/state-panel'
import { REGION_INFO } from '#/config/regions'
import { m } from '#/i18n'
import { formatDate, formatDay, isoFromDay } from '#/lib/format'
import type { Region } from '#/lib/search'
import { cn } from '#/lib/utils'
import type { DailyChange } from '#/server/types'
import { heatCell } from './heat'

type DailyRow = Extract<DailyChange, { available: true }>['rows'][number]

export interface DailyChangeTableProps {
  region: Region
  data: DailyChange
  busy?: boolean
}

export function DailyChangeTable({
  region,
  data,
  busy,
}: DailyChangeTableProps) {
  const name = REGION_INFO[region].name
  if (!data.available) {
    return (
      <StatePanel
        as="h3"
        title={
          data.from === null
            ? m.heatmap.dailyNeedsWeekTitle()
            : m.heatmap.dailyStartsTitle({ date: formatDate(data.from) })
        }
      >
        <p>{m.heatmap.dailyWaitBody({ days: data.days, region: name })}</p>
      </StatePanel>
    )
  }

  const columns: DataColumn<DailyRow>[] = [
    {
      id: 'name',
      header: m.heatmap.itemColumn(),
      meta: { rowHeader: true },
      cell: ({ row }) => (
        <ItemLink
          id={row.original.id}
          name={row.original.name}
          region={region}
          className="max-w-56 min-w-36 sm:max-w-80"
        />
      ),
    },
    ...data.cols.map((day, i): DataColumn<DailyRow> => ({
      id: String(day),
      header: () => <time dateTime={isoFromDay(day)}>{formatDay(day)}</time>,
      meta: {
        align: 'right',
        cellClassName: (row) =>
          cn('h-7 min-w-11 px-1', heatCell(row.d1[i] ?? null).className),
        cellStyle: (row) => heatCell(row.d1[i] ?? null).style ?? {},
      },
      cell: ({ row }) => <Delta value={row.original.d1[i] ?? null} compact />,
    })),
  ]

  return (
    <DataTable
      caption={m.heatmap.dailyCaption({
        count: data.rows.length,
        region: name,
        days: data.cols.length,
      })}
      label={m.heatmap.dailyTitle()}
      columns={columns}
      data={data.rows}
      getRowId={(row) => String(row.id)}
      busy={busy}
      stickyFirstColumn
      className="[&_table]:border-separate [&_table]:border-spacing-0.5"
    />
  )
}
