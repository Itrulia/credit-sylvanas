import { DataTable } from '#/components/data-table'
import type { DataColumn } from '#/components/data-table'
import { Delta } from '#/components/delta'
import { Icon } from '#/components/icon'
import { ItemLink } from '#/components/item-link'
import { Money } from '#/components/money'
import { REGION_INFO } from '#/config/regions'
import { formatNumber, formatPct } from '#/lib/format'
import { ItemSort } from '#/lib/search'
import type { Region, SortDir } from '#/lib/search'
import { itemName, wowheadItemUrl } from '#/lib/wowhead'
import type { ListRow } from '#/server/types'

const SORT_LABEL: Record<ItemSort, string> = {
  name: 'item name',
  marketValue: 'market value',
  historical: '60-day average',
  vsHist: 'market value against the 60-day average',
  avgSalePrice: 'average sale price',
  soldPerDay: 'units sold per day',
  saleRate: 'sale rate',
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

// Below md only Item, Market value and vs avg stay; the rest scroll in on wider screens.
const WIDE = 'hidden md:table-cell'
const money = { align: 'right', sortable: true } as const

function columns(region: Region, withRealm: boolean): DataColumn<ListRow>[] {
  const realm: DataColumn<ListRow>[] = withRealm
    ? [
        {
          id: 'realmMv',
          header: 'Realm market value',
          meta: { align: 'right' },
          cell: ({ row }) => (
            <Money
              copper={row.original.realmMv ?? null}
              align
              reason="Not listed on this realm"
            />
          ),
        },
        {
          id: 'minBuyout',
          header: 'Lowest buyout',
          meta: { align: 'right' },
          cell: ({ row }) =>
            row.original.minBuyout ? (
              <Money copper={row.original.minBuyout} align />
            ) : (
              <span className="text-muted-foreground">No listings</span>
            ),
        },
      ]
    : []
  return [
    {
      id: 'name',
      header: 'Item',
      meta: { sortable: true, rowHeader: true },
      cell: ({ row }) => {
        const { id, name } = row.original
        return (
          <span className="inline-flex items-center gap-1">
            <ItemLink id={id} name={name} region={region} />
            {/* the item link already gets the icon; Wowhead iconizes any
                wowhead.com href, so mark this one as already processed */}
            <a
              href={wowheadItemUrl(id)}
              data-wh-icon-added="true"
              data-wh-rename-link="false"
              target="_blank"
              rel="noreferrer"
              aria-label={`View ${itemName(name, id)} on Wowhead (opens Wowhead)`}
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
      header: 'Market value',
      meta: money,
      cell: ({ row }) => <Money copper={row.original.mv} align />,
    },
    ...realm,
    {
      id: 'historical',
      header: '60-day avg',
      meta: { ...money, headerClassName: WIDE, cellClassName: WIDE },
      cell: ({ row }) => <Money copper={row.original.hist} align />,
    },
    {
      id: 'vsHist',
      header: 'vs avg',
      meta: { align: 'right', sortable: true },
      cell: ({ row }) => <Delta value={row.original.vsHist} mode="vsHist" />,
    },
    {
      id: 'avgSalePrice',
      header: 'Avg sale',
      meta: { ...money, headerClassName: WIDE, cellClassName: WIDE },
      cell: ({ row }) => <Money copper={row.original.asp} align />,
    },
    {
      id: 'soldPerDay',
      header: 'Sold/day',
      meta: {
        align: 'right',
        sortable: true,
        headerClassName: WIDE,
        cellClassName: `${WIDE} num`,
      },
      cell: ({ row }) => formatNumber(row.original.spd, 1),
    },
    {
      id: 'saleRate',
      header: 'Sale rate',
      meta: {
        align: 'right',
        sortable: true,
        headerClassName: WIDE,
        cellClassName: `${WIDE} num`,
      },
      cell: ({ row }) =>
        formatPct(row.original.saleRate, { decimals: 0, sign: false }),
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
        ? 'A to Z'
        : 'Z to A'
      : dir === 'asc'
        ? 'lowest first'
        : 'highest first'
  return (
    <DataTable
      caption={`${name} items by ${SORT_LABEL[sort]}, ${order}`}
      captionHidden
      label={`${name} items`}
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
