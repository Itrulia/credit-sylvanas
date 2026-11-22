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
import { m } from '#/i18n'
import { formatNumber } from '#/lib/format'
import { HotBy } from '#/lib/search'
import type { Region } from '#/lib/search'
import type { HotRow } from '#/server/types'

// below md only the column the list is ranked by stays, next to price and trend
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

export function columns(
  region: Region,
  hot: HotBy,
  showChange: boolean,
): DataColumn<HotRow>[] {
  const spdClass = hot === 'traded' ? undefined : wide
  const goldClass = hot === 'gold' ? undefined : wide
  return [
    {
      id: 'rank',
      header: () => (
        <>
          <span aria-hidden="true">#</span>
          <span className="sr-only">{m.market.rankHeader()}</span>
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
      header: m.market.itemHeader(),
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
      header: () => (
        <Head label={m.shell.glossaryMarketValueLabel()} term="marketValue" />
      ),
      cell: ({ row }) => (
        <Money copper={row.original.mv} variant="compact" align />
      ),
      meta: { align: 'right' },
    },
    {
      id: 'vsHist',
      header: () => <Head label={m.market.vsHistHeader()} term="vsHist" />,
      cell: ({ row }) => <Delta value={row.original.vsHist} mode="vsHist" />,
      meta: { align: 'right' },
    },
    ...(showChange
      ? [
          {
            id: 'd1',
            header: () => (
              <Head label={m.market.changeHeader()} term="change" />
            ),
            cell: ({ row }) => <Delta value={row.original.d1} />,
            meta: { align: 'right' },
          } satisfies DataColumn<HotRow>,
        ]
      : []),
    {
      id: 'spd',
      header: () => (
        <Head label={m.market.soldPerDayHeader()} term="soldPerDay" />
      ),
      cell: ({ row }) => formatNumber(row.original.spd, 1),
      meta: {
        align: 'right',
        cellClassName: spdClass,
        headerClassName: spdClass,
      },
    },
    {
      id: 'goldVolume',
      header: () => (
        <Head label={m.market.goldPerDayHeader()} term="goldPerDay" />
      ),
      cell: ({ row }) => (
        <Money copper={row.original.goldVolume} variant="compact" align />
      ),
      meta: {
        align: 'right',
        cellClassName: goldClass,
        headerClassName: goldClass,
      },
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
      <TabsList
        className="pointer-coarse:h-11!"
        aria-label={m.market.rankByLabel()}
      >
        <TabsTrigger value="gold">{m.market.hottestTabGold()}</TabsTrigger>
        <TabsTrigger value="traded">{m.market.hottestTabSold()}</TabsTrigger>
      </TabsList>
      <TabsContent value={hot} className="space-y-3">
        <p className="text-sm">
          {m.market.hottestRanked({ region: name, hot })}
        </p>
        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm">
            {m.market.hottestEmpty({ region: name })}
          </p>
        ) : (
          <DataTable
            caption={m.market.hottestCaption({
              n: rows.length,
              region: name,
              hot,
            })}
            captionHidden
            label={m.market.hottestLabel({ region: name })}
            columns={columns(region, hot, showChange)}
            data={rows}
            getRowId={(row) => String(row.id)}
          />
        )}
        <Link
          to="/$region/items"
          params={{ region }}
          search={{ sort: hot === 'gold' ? 'goldPerDay' : 'soldPerDay' }}
          className="inline-flex min-h-6 items-center gap-1 text-sm font-medium underline pointer-coarse:min-h-11"
        >
          {m.market.seeAllItems()}
        </Link>
      </TabsContent>
    </Tabs>
  )
}
