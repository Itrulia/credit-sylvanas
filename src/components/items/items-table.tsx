import { DataTable } from '#/components/data-table'
import type { DataColumn } from '#/components/data-table'
import { Delta } from '#/components/delta'
import { Icon } from '#/components/icon'
import { ItemLink } from '#/components/item-link'
import { Money } from '#/components/money'
import { REGION_INFO } from '#/config/regions'
import { m } from '#/i18n'
import { formatNumber, formatPct } from '#/lib/format'
import { ItemSort } from '#/lib/search'
import type { Region, SortDir } from '#/lib/search'
import { itemName, wowheadItemUrl } from '#/lib/wowhead'
import type { ListRow } from '#/server/types'

const SORT_LABEL: Record<ItemSort, () => string> = {
  name: m.items.sortName,
  marketValue: m.items.sortMarketValue,
  historical: m.shell.glossaryHistoricalLabel,
  vsHist: m.items.sortVsHist,
  avgSalePrice: m.items.sortAvgSalePrice,
  soldPerDay: m.items.sortSoldPerDay,
  saleRate: m.items.sortSaleRate,
  goldPerDay: m.items.sortGoldPerDay,
}

/** Clicking the active column flips it. A new column starts high to low, names A to Z. */
export function nextSort(
  current: { sort: ItemSort; dir: SortDir },
  column: ItemSort,
): { sort: ItemSort; dir: SortDir } {
  if (current.sort === column) {
    return { sort: column, dir: current.dir === 'asc' ? 'desc' : 'asc' }
  }
  return { sort: column, dir: column === 'name' ? 'asc' : 'desc' }
}

// Every column stays on phones: the table scrolls sideways under a sticky
// Item column, so the sort column is always reachable (CONTEXT, Mobile first).
const money = { align: 'right', sortable: true } as const

function columns(region: Region, withRealm: boolean): DataColumn<ListRow>[] {
  const realm: DataColumn<ListRow>[] = withRealm
    ? [
        {
          id: 'realmMv',
          header: m.items.columnRealmMarketValue(),
          meta: { align: 'right' },
          cell: ({ row }) => (
            <Money
              copper={row.original.realmMv ?? null}
              align
              reason={m.items.realmNotListed()}
            />
          ),
        },
        {
          id: 'minBuyout',
          header: m.shell.glossaryMinBuyoutLabel(),
          meta: { align: 'right' },
          cell: ({ row }) =>
            row.original.minBuyout ? (
              <Money copper={row.original.minBuyout} align />
            ) : (
              <span className="text-muted-foreground">
                {m.items.noListings()}
              </span>
            ),
        },
      ]
    : []
  return [
    {
      id: 'name',
      header: m.items.columnItem(),
      meta: { sortable: true, rowHeader: true },
      cell: ({ row }) => {
        const { id, name } = row.original
        return (
          <span className="inline-flex items-center gap-1">
            <ItemLink
              id={id}
              name={name}
              region={region}
              className="max-w-56 sm:max-w-80"
            />
            {/* the item link already gets the icon; Wowhead iconizes any
                wowhead.com href, so mark this one as already processed */}
            <a
              href={wowheadItemUrl(id)}
              data-wh-icon-added="true"
              data-wh-rename-link="false"
              target="_blank"
              rel="noreferrer"
              aria-label={m.items.wowheadLinkLabel({
                name: itemName(name, id),
              })}
              className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground pointer-coarse:size-11"
            >
              <Icon name="open_in_new" />
            </a>
          </span>
        )
      },
    },
    {
      id: 'marketValue',
      header: m.shell.glossaryMarketValueLabel(),
      meta: { ...money, info: 'marketValue' },
      cell: ({ row }) => <Money copper={row.original.mv} align />,
    },
    ...realm,
    {
      id: 'historical',
      header: m.shell.glossaryHistoricalLabel(),
      meta: { ...money, info: 'historical' },
      cell: ({ row }) => <Money copper={row.original.hist} align />,
    },
    {
      id: 'vsHist',
      header: m.items.columnVsHist(),
      meta: { align: 'right', sortable: true, info: 'vsHist' },
      cell: ({ row }) => <Delta value={row.original.vsHist} mode="vsHist" />,
    },
    {
      id: 'avgSalePrice',
      header: m.shell.glossaryAvgSalePriceLabel(),
      meta: { ...money, info: 'avgSalePrice' },
      cell: ({ row }) => <Money copper={row.original.asp} align />,
    },
    {
      id: 'soldPerDay',
      header: m.shell.glossarySoldPerDayLabel(),
      meta: {
        align: 'right',
        sortable: true,
        cellClassName: 'num',
        info: 'soldPerDay',
      },
      cell: ({ row }) => formatNumber(row.original.spd, 1),
    },
    {
      id: 'saleRate',
      header: m.shell.glossarySaleRateLabel(),
      meta: {
        align: 'right',
        sortable: true,
        cellClassName: 'num',
        info: 'saleRate',
      },
      cell: ({ row }) =>
        formatPct(row.original.saleRate, { decimals: 0, sign: false }),
    },
    {
      id: 'goldPerDay',
      header: m.items.columnGoldPerDay(),
      meta: { ...money, info: 'goldPerDay' },
      cell: ({ row }) => (
        <Money
          copper={Math.round(row.original.spd * row.original.asp)}
          variant="compact"
          align
        />
      ),
    },
  ]
}

export interface ItemsTableProps {
  region: Region
  rows: ListRow[]
  sort: ItemSort
  dir: SortDir
  /** a sortable column id; the caller puts the new sort in the URL */
  onSort: (column: ItemSort) => void
  busy: boolean
  /** a realm is selected: add realm market value and lowest buyout */
  withRealm?: boolean
}

export function ItemsTable({
  region,
  rows,
  sort,
  dir,
  onSort,
  busy,
  withRealm = false,
}: ItemsTableProps) {
  const name = REGION_INFO[region].name
  const order =
    sort === 'name'
      ? dir === 'asc'
        ? m.items.orderAToZ()
        : m.items.orderZToA()
      : dir === 'asc'
        ? m.items.orderLowestFirst()
        : m.items.orderHighestFirst()
  return (
    <DataTable
      caption={m.items.tableCaption({
        region: name,
        sortLabel: SORT_LABEL[sort](),
        order,
      })}
      captionHidden
      label={m.items.tableLabel({ region: name })}
      columns={columns(region, withRealm)}
      data={rows}
      getRowId={(row) => String(row.id)}
      sort={{ id: sort, dir }}
      onSort={(id) => {
        const parsed = ItemSort.safeParse(id)
        if (parsed.success) {
          onSort(parsed.data)
        }
      }}
      busy={busy}
      stickyFirstColumn
    />
  )
}
