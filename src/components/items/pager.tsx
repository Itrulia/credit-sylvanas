import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Icon } from '#/components/icon'
import { m } from '#/i18n'
import { formatInt } from '#/lib/format'
import { PAGE_SIZE } from '#/lib/search'
import { cn } from '#/lib/utils'

export const lastPage = (total: number) =>
  Math.max(1, Math.ceil(total / PAGE_SIZE))

const STEP =
  'inline-flex min-h-11 min-w-11 items-center gap-1 rounded-md border px-3 text-sm'

function Step({
  page,
  label,
  children,
}: {
  page: number | null
  label: string
  children: ReactNode
}) {
  if (page === null) {
    return (
      <span
        aria-disabled="true"
        className={cn(STEP, 'text-muted-foreground opacity-60')}
      >
        {children}
        <span className="sr-only">{label}</span>
      </span>
    )
  }
  return (
    <Link
      from="/$region/items/"
      to="."
      search={(prev) => ({ ...prev, page: page === 1 ? undefined : page })}
      className={cn(STEP, 'hover:bg-accent')}
    >
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  )
}

export function Pager({ page, total }: { page: number; total: number }) {
  const last = lastPage(total)
  if (last === 1) {
    return null
  }
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  return (
    <nav
      aria-label={m.items.pagerLabel()}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="num text-sm text-muted-foreground">
        {m.items.pagerRange({
          from: formatInt(from),
          to: formatInt(to),
          total: formatInt(total),
        })}
      </p>
      <div className="flex gap-2">
        <Step page={page > 1 ? page - 1 : null} label={m.items.pagerPrevious()}>
          <Icon name="chevron_left" />
          <span aria-hidden="true">{m.items.pagerPrevShort()}</span>
        </Step>
        <Step page={page < last ? page + 1 : null} label={m.items.pagerNext()}>
          <span aria-hidden="true">{m.items.pagerNextShort()}</span>
          <Icon name="chevron_right" />
        </Step>
      </div>
    </nav>
  )
}
