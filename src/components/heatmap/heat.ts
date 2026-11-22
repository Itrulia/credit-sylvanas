import type { CSSProperties } from 'react'
import { binFill, binInk, binOf } from '#/lib/bins'
import { m } from '#/i18n'
import { formatInt } from '#/lib/format'
import type { HeatSort } from '#/lib/search'
import { cn } from '#/lib/utils'

// Literal class names so Tailwind sees them; keys are binInk's tokens.
const INK: Record<string, string> = {
  '--foreground': 'text-foreground',
  '--card': 'text-card',
}

/** Fill and text colour for one heatmap cell: the bin of `ratio`, hatch when null. */
export function heatCell(ratio: number | null): {
  className: string
  style?: CSSProperties
} {
  const bin = binOf(ratio)
  if (bin === null) {
    return { className: 'heat-cell hatch text-foreground' }
  }
  return {
    className: cn('heat-cell', INK[binInk(bin)]),
    style: { background: binFill(bin) },
  }
}

/** "25 items: 14 pricier than usual, 9 cheaper, 2 about usual." */
export function momentumSummary(rows: readonly { vsHist: number | null }[]) {
  let up = 0
  let down = 0
  let flat = 0
  let none = 0
  for (const { vsHist } of rows) {
    const bin = binOf(vsHist)
    if (bin === null) {
      none++
    } else if (bin > 0) {
      up++
    } else if (bin < 0) {
      down++
    } else {
      flat++
    }
  }
  const counts = {
    n: rows.length,
    count: formatInt(rows.length),
    up,
    down,
    flat,
  }
  return none
    ? m.heatmap.momentumSummaryWithMissing({ ...counts, none })
    : m.heatmap.momentumSummary(counts)
}

/** Pricier first, a missing 60-day comparison last. */
export function byVsHist<TRow extends { vsHist: number | null }>(
  rows: readonly TRow[],
): TRow[] {
  return [...rows].sort((a, b) => {
    if (a.vsHist === null) {
      return b.vsHist === null ? 0 : 1
    }
    return b.vsHist === null ? -1 : b.vsHist - a.vsHist
  })
}

export const SORT_LABEL: Record<HeatSort, () => string> = {
  volume: m.heatmap.sortVolume,
  spread: m.heatmap.sortSpread,
  name: m.heatmap.sortName,
}

/** Pressing the active header goes back to the default volume order. */
export const nextSort = (current: HeatSort, pressed: HeatSort): HeatSort =>
  current === pressed ? 'volume' : pressed

export const sortAnnouncement = (sort: HeatSort) =>
  (sort === 'name' ? m.heatmap.sortedAsc : m.heatmap.sortedDesc)({
    sort: SORT_LABEL[sort](),
  })
