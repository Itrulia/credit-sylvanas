import { formatPct } from '#/lib/format'
import { cn } from '#/lib/utils'

export type DeltaMode = 'change' | 'vsHist' | 'vsMedian'

export interface DeltaProps {
  value: number | null
  mode?: DeltaMode
  /** no glyph, no decimal: only the day-by-day heatmap uses it */
  compact?: boolean
  className?: string
}

// within +-0.5% counts as flat
const FLAT = 0.005

function srText(value: number, mode: DeltaMode, dir: -1 | 0 | 1) {
  const pct = `${formatPct(value, { sign: false }).replace('%', '')} percent`
  if (mode === 'change') {
    return dir === 0 ? 'unchanged' : `${dir > 0 ? 'up' : 'down'} ${pct}`
  }
  if (mode === 'vsHist') {
    return dir === 0
      ? 'about the same as the 60-day average'
      : `${pct} ${dir > 0 ? 'above' : 'below'} 60-day average`
  }
  return dir === 0
    ? 'about the same as other regions'
    : `${pct} ${dir > 0 ? 'above' : 'below'} the cross-region median`
}

export function Delta({
  value,
  mode = 'change',
  compact,
  className,
}: DeltaProps) {
  if (value === null || !Number.isFinite(value)) {
    return (
      <span className={cn('num text-muted-foreground', className)}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Not enough history yet</span>
      </span>
    )
  }
  const dir = value > FLAT ? 1 : value < -FLAT ? -1 : 0
  const tone = dir > 0 ? 'text-up' : dir < 0 ? 'text-down' : 'text-flat'
  const glyph = dir > 0 ? '▲' : dir < 0 ? '▼' : '≈'
  const shown = dir === 0 ? 0 : value
  const text = compact
    ? formatPct(shown, { decimals: 0 }).replace('%', '')
    : formatPct(shown)
  return (
    <span
      className={cn(
        'num inline-flex items-baseline gap-1 whitespace-nowrap',
        tone,
        className,
      )}
    >
      {!compact && (
        <span aria-hidden="true" className="dir-glyph">
          {glyph}
        </span>
      )}
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">{srText(value, mode, dir)}</span>
    </span>
  )
}
