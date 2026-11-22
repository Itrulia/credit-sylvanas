import { Link, useNavigate } from '@tanstack/react-router'
import { DataTable } from '#/components/data-table'
import type { DataColumn } from '#/components/data-table'
import { Delta } from '#/components/delta'
import type { GlossaryKey } from '#/components/glossary'
import { InfoPopover } from '#/components/info-popover'
import { ItemLink } from '#/components/item-link'
import { Money } from '#/components/money'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { REGION_INFO } from '#/config/regions'
import { formatNumber } from '#/lib/format'
import { HotBy } from '#/lib/search'
import type { Region } from '#/lib/search'
import type { HotRow } from '#/server/types'

const wide = 'hidden md:table-cell'
const margin = 'w-10 border-r border-border-strong'

function Head({ label, term }: { label: string; term: GlossaryKey }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {label}
      <InfoPopover term={term} />
    </span>
  )
}

function columns(region: Region, showChange: boolean): DataColumn<HotRow>[] {
  return [
    {
      id: 'rank',
      header: () => (
        <>
          <span aria-hidden="true">#</span>
          <span className="sr-only">Rank</span>
        </>
      ),
      cell: ({ row }) => (
        <span
          className={
            row.index === 0
              ? 'font-semibold text-brand-tomato'
              : 'text-muted-foreground'
          }
        >
          {row.index + 1}
        </span>
      ),
      meta: { align: 'right', cellClassName: margin, headerClassName: margin },
    },
    {
      id: 'item',
      header: 'Item',
      cell: ({ row }) => (
        <ItemLink
          id={row.original.id}
          name={row.original.name}
          region={region}
          className="line-clamp-2"
        />
      ),
      meta: { rowHeader: true, cellClassName: 'min-w-36' },
    },
    {
      id: 'mv',
      header: () => <Head label="Market value" term="marketValue" />,
      cell: ({ row }) => (
        <Money copper={row.original.mv} variant="compact" align />
      ),
      meta: { align: 'right' },
    },
    {
      id: 'vsHist',
      header: () => <Head label="vs 60-day avg" term="vsHist" />,
      cell: ({ row }) => <Delta value={row.original.vsHist} mode="vsHist" />,
      meta: { align: 'right' },
    },
    ...(showChange
      ? [
          {
            id: 'd1',
            header: () => <Head label="Change" term="change" />,
            cell: ({ row }) => <Delta value={row.original.d1} />,
            meta: { align: 'right' },
          } satisfies DataColumn<HotRow>,
        ]
      : []),
    {
      id: 'spd',
      header: () => <Head label="Sold/day" term="soldPerDay" />,
      cell: ({ row }) => formatNumber(row.original.spd, 1),
      meta: { align: 'right', cellClassName: wide, headerClassName: wide },
    },
    {
      id: 'goldVolume',
      header: () => <Head label="Gold/day" term="goldPerDay" />,
      cell: ({ row }) => (
        <Money copper={row.original.goldVolume} variant="compact" align />
      ),
      meta: { align: 'right', cellClassName: wide, headerClassName: wide },
    },
  ]
}

export interface HottestTableProps {
  region: Region
  hot: HotBy
  rows: HotRow[]
  /** the Change column only exists once a previous daily update does */
  showChange: boolean
}

export function HottestTable({
  region,
  hot,
  rows,
  showChange,
}: HottestTableProps) {
  const navigate = useNavigate({ from: '/$region/' })
  const name = REGION_INFO[region].name
  const measure = hot === 'gold' ? 'gold traded' : 'units sold'
  return (
    <Tabs
      value={hot}
      onValueChange={(v) => {
        const next = HotBy.safeParse(v)
        if (next.success) {
          void navigate({
            search: (prev) => ({ ...prev, hot: next.data }),
            resetScroll: false,
          })
        }
      }}
    >
      <TabsList className="pointer-coarse:h-11!" aria-label="Rank by">
        <TabsTrigger value="gold">Most gold traded</TabsTrigger>
        <TabsTrigger value="traded">Most sold</TabsTrigger>
      </TabsList>
      <TabsContent value={hot} className="space-y-3">
        <p className="text-sm">
          Ranked by {measure} per day across {name}.
        </p>
        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm">
            Not enough trading in {name} to rank items yet. Items need about one
            sale every two days to count.
          </p>
        ) : (
          <DataTable
            caption={`Top ${rows.length} ${name} items by ${measure} per day`}
            captionHidden
            label={`Hottest ${name} items`}
            columns={columns(region, showChange)}
            data={rows}
            getRowId={(row) => String(row.id)}
          />
        )}
        <Link
          to="/$region/items"
          params={{ region }}
          search={{ sort: 'soldPerDay' }}
          className="inline-flex min-h-6 items-center gap-1 text-sm font-medium underline pointer-coarse:min-h-11"
        >
          See all items
        </Link>
      </TabsContent>
    </Tabs>
  )
}
