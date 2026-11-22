import { m } from '#/i18n'
import { formatPct } from '#/lib/format'
import { cn } from '#/lib/utils'

export type DeltaMode = 'change' | 'vsHist' | 'vsMedian'

export interface DeltaProps {
  value: number | null
  mode?: DeltaMode
  /** no glyph, no decimal: only the day-by-day heatmap uses it */
  compact?: boolean
  /** what `vsMedian` compares against, read out by screen readers */
  reference?: string
  className?: string
}

// within +-0.5% counts as flat
const FLAT = 0.005

function srText(
  value: number,
  mode: DeltaMode,
  dir: -1 | 0 | 1,
  reference: string,
) {
  const pct = formatPct(value, { sign: false }).replace('%', '')
  if (mode === 'change') {
    return dir === 0
      ? m.shell.deltaUnchanged()
      : (dir > 0 ? m.shell.deltaUp : m.shell.deltaDown)({ value: pct })
  }
  if (mode === 'vsHist') {
    return dir === 0
      ? m.shell.deltaHistSame()
      : (dir > 0 ? m.shell.deltaAboveHist : m.shell.deltaBelowHist)({
          value: pct,
        })
  }
  return dir === 0
    ? m.shell.deltaRefSame({ reference })
    : (dir > 0 ? m.shell.deltaAboveRef : m.shell.deltaBelowRef)({
        value: pct,
        reference,
      })
}

export function Delta({
  value,
  mode = 'change',
  compact,
  reference = m.shell.deltaDefaultReference(),
  className,
}: DeltaProps) {
  if (value === null || !Number.isFinite(value)) {
    return (
      <span className={cn('num text-muted-foreground', className)}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{m.shell.deltaNoHistory()}</span>
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
      <span className="sr-only">{srText(value, mode, dir, reference)}</span>
    </span>
  )
}
