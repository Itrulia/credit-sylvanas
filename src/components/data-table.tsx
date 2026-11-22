import type { ReactNode } from 'react'
import { tableFeatures, useTable } from '@tanstack/react-table'
import type {
  CellData,
  ColumnDef,
  RowData,
  TableFeatures,
} from '@tanstack/react-table'
import type { SortDir } from '#/lib/search'
import { cn } from '#/lib/utils'
import type { GlossaryKey } from './glossary'
import { Icon } from './icon'
import { InfoPopover } from './info-popover'

declare module '@tanstack/react-table' {
  interface ColumnMeta<
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData,
  > {
    align?: 'left' | 'right'
    /** full-bleed heatmap cells */
    cellClassName?: string | ((row: TData) => string)
    cellStyle?: (row: TData) => React.CSSProperties
    headerClassName?: string
    /** header gets a sort button that calls onSort(column id) */
    sortable?: boolean
    /** glossary term for an info popover next to the header (outside the sort button) */
    info?: GlossaryKey
    /** render the cell as <th scope="row"> (the item column) */
    rowHeader?: boolean
    /** keep ts happy about unused generics */
    _types?: [TFeatures, TValue]
  }
}

export const dataTableFeatures = tableFeatures({})
export type DataColumn<TData extends RowData> = ColumnDef<
  typeof dataTableFeatures,
  TData,
  any
>

export interface DataTableProps<TData extends RowData> {
  caption: ReactNode
  /** visually hide the caption (the section heading already says it) */
  captionHidden?: boolean
  /** plain-text caption for the scroll region's label */
  label: string
  columns: DataColumn<TData>[]
  data: TData[]
  getRowId?: (row: TData) => string
  sort?: { id: string; dir: SortDir }
  onSort?: (columnId: string) => void
  /** old rows stay visible, dimmed, while new data loads */
  busy?: boolean
  stickyFirstColumn?: boolean
  className?: string
}

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const

/**
 * Semantic table over TanStack Table v9. Sorting is the caller's (URL or
 * server); this only renders the header buttons and aria-sort.
 */
export function DataTable<TData extends RowData>({
  caption,
  captionHidden,
  label,
  columns,
  data,
  getRowId,
  sort,
  onSort,
  busy,
  stickyFirstColumn,
  className,
}: DataTableProps<TData>) {
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  })
  const sticky = 'sticky left-0 z-10 bg-card'
  return (
    <div
      role="region"
      tabIndex={0}
      aria-label={`${label}, scrolls sideways`}
      aria-busy={busy || undefined}
      className={cn(
        // relative: sr-only text inside is absolute and would escape the scroller
        'relative overflow-x-auto rounded-md border',
        busy && 'opacity-60',
        className,
      )}
    >
      <table className="w-full border-collapse text-[0.8125rem] leading-[1.125rem]">
        <caption
          className={cn(
            'px-3 py-2 text-left text-sm',
            captionHidden && 'sr-only',
          )}
        >
          {caption}
        </caption>
        <thead className="ledger-rule">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header, i) => {
                const meta = header.column.columnDef.meta
                const dir =
                  sort && sort.id === header.column.id ? sort.dir : null
                const right = meta?.align === 'right'
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      meta?.sortable
                        ? dir
                          ? ARIA_SORT[dir]
                          : 'none'
                        : undefined
                    }
                    className={cn(
                      'text-label px-3 py-2 align-bottom whitespace-nowrap',
                      right ? 'text-right' : 'text-left',
                      stickyFirstColumn && i === 0 && sticky,
                      meta?.headerClassName,
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      // same height as the info button, so plain headers line up
                      <span
                        className={cn(
                          'inline-flex min-h-6 items-center gap-0.5 pointer-coarse:min-h-11',
                          right && 'flex-row-reverse',
                        )}
                      >
                        {meta?.sortable && onSort ? (
                          <button
                            type="button"
                            onClick={() => onSort(header.column.id)}
                            className={cn(
                              'inline-flex min-h-6 items-center gap-1 uppercase pointer-coarse:min-h-11',
                              right && 'flex-row-reverse',
                            )}
                          >
                            <table.FlexRender header={header} />
                            <Icon
                              name={
                                dir
                                  ? dir === 'asc'
                                    ? 'arrow_upward'
                                    : 'arrow_downward'
                                  : 'unfold_more'
                              }
                              className={
                                dir ? undefined : 'text-muted-foreground'
                              }
                            />
                          </button>
                        ) : (
                          <table.FlexRender header={header} />
                        )}
                        {meta?.info && <InfoPopover term={meta.info} />}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-t hover:bg-accent focus-within:bg-accent"
            >
              {row.getAllCells().map((cell, i) => {
                const meta = cell.column.columnDef.meta
                const Cell = meta?.rowHeader ? 'th' : 'td'
                const extra =
                  typeof meta?.cellClassName === 'function'
                    ? meta.cellClassName(row.original)
                    : meta?.cellClassName
                return (
                  <Cell
                    key={cell.id}
                    scope={meta?.rowHeader ? 'row' : undefined}
                    style={meta?.cellStyle?.(row.original)}
                    className={cn(
                      'px-3 py-1.5 font-normal',
                      meta?.align === 'right'
                        ? 'text-right font-medium'
                        : 'text-left',
                      stickyFirstColumn && i === 0 && sticky,
                      extra,
                    )}
                  >
                    <table.FlexRender cell={cell} />
                  </Cell>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
