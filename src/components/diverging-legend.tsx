import { m } from '#/paraglide/messages.js'
import { BINS, BIN_LABELS, binFill } from '#/lib/bins'
import { cn } from '#/lib/utils'

export interface DivergingLegendProps {
  /** [low end, high end], e.g. ['Cheaper than usual', 'Pricier than usual'] */
  labels: readonly [string, string]
  className?: string
}

const swatch =
  'inline-block size-3.5 shrink-0 rounded-[2px] border border-input'

/** Every bin's range as text, so no colour has to be read by hue. */
export function DivergingLegend({ labels, className }: DivergingLegendProps) {
  return (
    <div className={cn('text-micro text-muted-foreground', className)}>
      <p className="mb-1">
        {labels[0]} ← → {labels[1]}
      </p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {BINS.map((bin) => (
          <li key={bin} className="inline-flex items-center gap-1">
            <span
              aria-hidden="true"
              className={swatch}
              style={{ background: binFill(bin) }}
            />
            {BIN_LABELS[bin]}
          </li>
        ))}
        <li className="inline-flex items-center gap-1">
          <span aria-hidden="true" className={cn(swatch, 'hatch')} />
          {m.shell_noData()}
        </li>
      </ul>
    </div>
  )
}
