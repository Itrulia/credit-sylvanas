import type { ReactNode } from 'react'
import type { StatRange } from '#/lib/search'
import type { IconName } from '#/lib/icons'
import { Icon } from '#/components/icon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { RANGE_OPTIONS } from './stats'

export interface StatCardProps {
  title: string
  range: StatRange
  onRangeChange: (range: StatRange) => void
  children: ReactNode
}

/** Card shell for one statistics card: H3 title, its own range select, body. */
export function StatCard({
  title,
  range,
  onRangeChange,
  children,
}: StatCardProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-md border bg-card p-4">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <Select
          value={range}
          onValueChange={(v) => onRangeChange(v as StatRange)}
        >
          <SelectTrigger
            aria-label={`Range for ${title}`}
            className="min-w-20 pointer-coarse:data-[size=default]:h-11"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((o) => (
              <SelectItem
                key={o.value}
                value={o.value}
                className="pointer-coarse:min-h-11"
              >
                <span aria-hidden="true">{o.label}</span>
                <span className="sr-only">{o.long}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>
      {children}
    </section>
  )
}

/** In-card empty or not-yet state: icon, bold title, one or two lines. */
export function CardNote({
  title,
  icon = 'info',
  children,
}: {
  title: ReactNode
  icon?: IconName
  children?: ReactNode
}) {
  return (
    <div className="flex min-h-40 flex-col items-start justify-center gap-2 rounded-md bg-muted/50 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        <Icon name={icon} className="text-muted-foreground" />
        {title}
      </p>
      {children}
    </div>
  )
}

/** The "Show as table" body: a real table, rows already newest first. */
export function StatTable({
  caption,
  head,
  rows,
}: {
  caption: string
  head: string[]
  rows: { key: string | number; cells: ReactNode[] }[]
}) {
  return (
    <div className="mt-2 max-h-80 overflow-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="ledger-rule">
          <tr>
            {head.map((h, i) => (
              <th
                key={h}
                scope="col"
                className={`py-1 pr-3 font-semibold ${i ? 'text-right' : 'text-left'}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b last:border-0">
              {r.cells.map((c, i) =>
                i === 0 ? (
                  <th
                    key={i}
                    scope="row"
                    className="py-1 pr-3 text-left font-normal"
                  >
                    {c}
                  </th>
                ) : (
                  <td key={i} className="py-1 pr-3 text-right">
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
