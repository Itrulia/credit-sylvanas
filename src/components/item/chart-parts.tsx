// Shared TanStack Charts bits for cards 1 and 2 (DESIGN §5 chart rules).
import type { ReactNode } from 'react'
import { dot, text } from '@tanstack/charts'
import { decorative } from '@tanstack/charts/mark/decorative'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { formatDay, formatDayLong } from '#/lib/format'
import { formatMoney, moneyText } from '#/lib/money'
import { mondayOf } from './stats'

export const CHART_HEIGHT = 240
/** Width of the server-rendered SVG; the chart refits its card after mount. */
export const CHART_INITIAL_WIDTH = 560

export const axisMoney = (copper: number) =>
  moneyText(formatMoney(copper, 'axis'))

/** Price axes don't start at 0: 5% padding around the data. */
export const moneyDomain = ([min, max]: readonly [number, number]): [
  number,
  number,
] => {
  // a flat series still gets a visible band
  const pad = (max - min) * 0.05 || max * 0.05
  return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)]
}

/** Every day for short series, Mondays beyond 21 days, else every few days. */
export function dayTicks(days: readonly number[]) {
  const last = days.at(-1)
  if (last === undefined) {
    return []
  }
  const first = days[0]
  if (days.length <= 7) {
    return [...days]
  }
  if (last - first > 21) {
    return days.filter((d) => mondayOf(d) === d)
  }
  return days.filter((d) => (d - first) % 3 === 0)
}

export const tickDay = (day: number) => formatDay(day)

/** The left money axis with grid lines, padded around every plotted value. */
export function moneyAxis(values: readonly (number | null | undefined)[]) {
  const v = values.filter((x): x is number => x != null)
  const domain = v.length
    ? moneyDomain([Math.min(...v), Math.max(...v)])
    : [0, 1]
  return {
    scale: scaleLinear().domain(domain),
    grid: { stroke: 'var(--chart-grid)', strokeOpacity: 1 },
    axis: {
      line: false,
      ticks: { count: 5, size: 0, format: axisMoney },
    },
  }
}

/** Day axis options: a baseline and `dayTicks` labels, no tick stubs. */
export const dayAxis = (days: readonly number[]) => ({
  line: { stroke: 'var(--chart-baseline)', strokeOpacity: 1 },
  ticks: { values: dayTicks(days), size: 0, format: tickDay },
})

interface EndMarkOptions<T> {
  key: string
  y: (row: T) => number | null | undefined
  color: string
  label: string
  /** fill of the last dot; the region market value line ends in tomato */
  lastFill?: string
  /** dot every point (short series), only the last, or none */
  dots: 'every' | 'last' | 'none'
  yScale?: string
}

/**
 * Dots and a direct end label for one line, so series never rely on colour
 * alone. Decorative: focus and the tooltip come from the line itself.
 */
export function endMarks<T extends { day: number }>(
  rows: readonly T[],
  { key, y, color, label, lastFill = color, dots, yScale }: EndMarkOptions<T>,
) {
  const valid = rows.filter((r) => y(r) != null)
  const last = valid.at(-1)
  if (!last) {
    return []
  }
  const ring = { stroke: 'var(--card)', strokeWidth: 1 }
  return [
    ...(dots === 'every'
      ? [
          decorative(
            dot(valid.slice(0, -1), {
              id: `end-dot-${key}`,
              x: (r) => r.day,
              y,
              yScale,
              r: 3,
              fill: color,
              ...ring,
            }),
          ),
        ]
      : []),
    ...(dots === 'none'
      ? []
      : [
          decorative(
            dot([last], {
              id: `end-dot-${key}-last`,
              x: (r) => r.day,
              y,
              yScale,
              r: 4,
              fill: lastFill,
              ...ring,
            }),
          ),
        ]),
    decorative(
      text([last], {
        id: `end-label-${key}`,
        x: (r) => r.day,
        y,
        yScale,
        text: () => label,
        fill: color,
        anchor: 'start',
        dx: 6,
        fontSize: 11,
        fontWeight: 500,
      }),
    ),
  ]
}

export interface TooltipRow {
  key: string
  label: string
  color: string
  dash?: string
  value: ReactNode
}

/** Tooltip body: date header, then swatch + label + value per row. */
export function ChartTip({
  day,
  rows,
}: {
  day: number | undefined
  rows: TooltipRow[]
}) {
  if (day === undefined) {
    return null
  }
  return (
    <div className="rounded-md bg-popover px-3 py-2 text-xs text-popover-foreground shadow-pop">
      <p className="mb-1 font-semibold">{formatDayLong(day)}</p>
      <ul className="space-y-0.5">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2">
            <Swatch color={r.color} dash={r.dash} />
            <span className="text-muted-foreground">{r.label}</span>
            <span className="ml-auto pl-3">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Line swatch that also shows the dash, for legends and tooltips. */
export function Swatch({ color, dash }: { color: string; dash?: string }) {
  return (
    <svg width="16" height="8" aria-hidden="true" className="shrink-0">
      <line
        x1="0"
        y1="4"
        x2="16"
        y2="4"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={dash}
      />
    </svg>
  )
}
