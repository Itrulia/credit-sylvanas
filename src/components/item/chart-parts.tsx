// Shared recharts bits for cards 1 and 2 (DESIGN §5 chart rules).
import type { ReactNode } from 'react'
import { formatDay, formatDayLong } from '#/lib/format'
import { formatMoney, moneyText } from '#/lib/money'
import { mondayOf } from './stats'

export const CHART_HEIGHT = 240

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

interface DotArgs {
  cx?: number
  cy?: number
  index?: number
}

/**
 * Dot renderer: every point when the series is short, otherwise only the last.
 * `lastFill` lets the region market value line mark its end in tomato.
 */
export const endDot =
  (count: number, stroke: string, lastFill = stroke, everyPoint = count <= 6) =>
  ({ cx, cy, index }: DotArgs) => {
    const isLast = index === count - 1
    if (cx === undefined || cy === undefined || (!isLast && !everyPoint)) {
      return <g key={`dot-${index}`} />
    }
    return (
      <circle
        key={`dot-${index}`}
        data-testid="point-dot"
        cx={cx}
        cy={cy}
        r={isLast ? 4 : 3}
        fill={isLast ? lastFill : stroke}
        stroke="var(--card)"
        strokeWidth={1}
      />
    )
  }

interface LabelArgs {
  x?: number | string
  y?: number | string
  index?: number
}

/** Direct end label on the last point, so series never rely on colour alone. */
export const endLabel =
  (count: number, text: string, fill: string) =>
  ({ x, y, index }: LabelArgs) =>
    index === count - 1 ? (
      <text
        x={Number(x) + 6}
        y={Number(y) + 4}
        fill={fill}
        className="text-micro"
      >
        {text}
      </text>
    ) : null

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
