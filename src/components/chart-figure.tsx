import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { ClientOnly } from '@tanstack/react-router'
import { m } from '#/i18n'
import { Icon } from './icon'
import { Skeleton } from './ui/skeleton'

export interface ChartFigureProps {
  /** generated summary sentence(s); also the figcaption */
  summary: ReactNode
  /** freshness and credit line under the summary */
  footer?: ReactNode
  /** the chart itself */
  children: ReactNode
  /** rows for the "Show as table" disclosure, rendered only when open */
  table?: () => ReactNode
  /** recharts can't measure on the server; SVG heatmaps pass false */
  clientOnly?: boolean
  /** skeleton size while the client-only chart mounts */
  height?: number
  className?: string
}

export function ChartFigure({
  summary,
  footer,
  children,
  table,
  clientOnly = true,
  height = 240,
  className,
}: ChartFigureProps) {
  const [open, setOpen] = useState(false)
  const tableId = useId()
  const skeleton = (
    <Skeleton
      style={{ height }}
      className="w-full rounded-md bg-muted"
      aria-hidden="true"
    />
  )
  return (
    <figure className={className}>
      {clientOnly ? (
        <ClientOnly fallback={skeleton}>{children}</ClientOnly>
      ) : (
        children
      )}
      <figcaption className="mt-2 space-y-1 text-sm">
        <p>{summary}</p>
        {footer}
      </figcaption>
      {table && (
        <div className="mt-2">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={tableId}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex min-h-6 items-center gap-1 text-sm underline pointer-coarse:min-h-11"
          >
            <Icon name={open ? 'expand_less' : 'expand_more'} />
            {open ? m.shell.chartHideTable() : m.shell.chartShowTable()}
          </button>
          {/* hidden, the table is not in the DOM, so it adds no tab stops */}
          <div id={tableId}>{open && table()}</div>
        </div>
      )}
    </figure>
  )
}
