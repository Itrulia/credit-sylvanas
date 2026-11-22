import { REGION_INFO } from '#/config/regions'
import { ChartFigure } from '#/components/chart-figure'
import { Delta } from '#/components/delta'
import { DivergingLegend } from '#/components/diverging-legend'
import { Money } from '#/components/money'
import { binFill, binOf } from '#/lib/bins'
import { dayOf, formatDate, formatDayLong, formatNumber } from '#/lib/format'
import type { Region, StatRange } from '#/lib/search'
import type { HistoryPoint, ItemHistory } from '#/server/types'
import { CardNote, StatCard, StatTable } from './stat-card'
import type { DotGrid } from './stats'
import {
  RANGE_DAYS,
  WEEKDAYS,
  dailyGrid,
  dotRadius,
  heatmapSummary,
  hourlyGrid,
  inRange,
  rangeNote,
} from './stats'

const CELL = 24
const LEFT = 32
const TOP = 20
const MIN_DAYS = 7

/** Dot heatmap: colour is the diverging bin vs the median, area grows with the value. */
export function DotHeatmap({ grid, label }: { grid: DotGrid; label: string }) {
  const width = LEFT + grid.columns.length * CELL
  const height = TOP + grid.rows.length * CELL
  // "22 Nov" is wider than a cell, so daily columns label every other week
  const every = grid.layout === 'daily' && grid.columns.length > 1 ? 2 : 1
  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label={label}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="text-muted-foreground"
      >
        {grid.columns.map((c, i) =>
          i % every === 0 ? (
            <text
              key={c.key}
              x={LEFT + i * CELL + CELL / 2}
              y={TOP - 6}
              textAnchor={every > 1 ? 'start' : 'middle'}
              className="fill-current text-micro"
            >
              {c.label}
            </text>
          ) : null,
        )}
        {grid.rows.map((r, i) => (
          <text
            key={r}
            x={0}
            y={TOP + i * CELL + CELL / 2 + 4}
            className="fill-current text-micro"
          >
            {r}
          </text>
        ))}
        {grid.cells.map((c) => {
          const ratio = grid.median ? c.value / grid.median - 1 : null
          return (
            <circle
              key={`${c.col}:${c.row}`}
              cx={LEFT + c.col * CELL + CELL / 2}
              cy={TOP + c.row * CELL + CELL / 2}
              r={dotRadius(c.value, grid.median)}
              fill={binFill(binOf(ratio) ?? 0)}
              stroke="var(--input)"
              strokeWidth={1}
            />
          )
        })}
      </svg>
    </div>
  )
}

export interface HeatmapCardProps {
  kind: 'value' | 'sales'
  /** the full 90-day region history */
  points: HistoryPoint[]
  realm: ItemHistory['realm']
  realmName: string | null
  region: Region
  range: StatRange
  onRangeChange: (range: StatRange) => void
}

const TITLE = {
  value: 'Heatmap: market value',
  sales: 'Heatmap: sales',
} as const
const LEGEND = {
  value: ['Below the range median', 'Above the range median'],
  sales: ['Fewer sales than usual', 'More sales than usual'],
} as const

/** Cards 3 and 4: weekday heatmaps of market value and sales. */
export function HeatmapCard({
  kind,
  points,
  realm,
  realmName,
  region,
  range,
  onRangeChange,
}: HeatmapCardProps) {
  const name = REGION_INFO[region].name
  const shown = inRange(points, range)
  const daily = shown.map((p) => ({
    day: p.day,
    value: kind === 'value' ? p.mv : p.spd,
  }))

  // card 3 with a realm switches to hourly once the scans cover 7 days in range
  const lastScan = realm?.scans.at(-1)
  const scans =
    kind === 'value' && realm && lastScan
      ? realm.scans.filter(
          (s) => dayOf(s.t) > dayOf(lastScan.t) - RANGE_DAYS[range],
        )
      : []
  const hourly = scans.length ? hourlyGrid(scans) : null
  const useHourly = hourly !== null && hourly.days >= MIN_DAYS

  const notes: string[] = []
  if (kind === 'value' && realmName && !useHourly) {
    notes.push(
      `Hourly view for ${realmName} starts after ${MIN_DAYS} days of scans (${hourly?.days ?? 0} so far).`,
    )
  }
  if (kind === 'sales' && realmName) {
    notes.push('Sales are only published per region.')
  }

  let body
  if (!useHourly && daily.length < MIN_DAYS) {
    const firstWeekEnds = (points[0]?.day ?? 0) + MIN_DAYS - 1
    body = (
      <CardNote title="The heatmap needs a week of daily updates.">
        <p>
          We have {daily.length} of {MIN_DAYS} for this item in {name}.{' '}
          {points.length >= MIN_DAYS
            ? 'Pick 30D or 90D to see more.'
            : `The first full week ends ${formatDate(firstWeekEnds)}.`}
        </p>
      </CardNote>
    )
  } else if (kind === 'sales' && daily.every((d) => d.value === 0)) {
    body = (
      <CardNote title="No recorded sales in this range.">
        <p>
          TSM saw no {name} sales for this item in the last {RANGE_DAYS[range]}{' '}
          days.
        </p>
      </CardNote>
    )
  } else {
    const grid = useHourly ? hourly : dailyGrid(daily)
    const summary = heatmapSummary(grid, range)
    const caption = useHourly
      ? `Each dot is the average for that weekday and hour (UTC) on ${realmName}, from ${grid.days} days of scans.`
      : `Each dot is one day. Bigger and redder means further above the ${RANGE_DAYS[range]}-day median, bluer means below.`
    const note = useHourly ? null : rangeNote(range, points.length)
    const fmt = (v: number) =>
      kind === 'value' ? (
        <Money copper={Math.round(v)} />
      ) : (
        `${formatNumber(v, 1)} a day`
      )
    // newest first; hourly slots go by weekday then hour
    const rows = useHourly
      ? grid.cells.map((c) => ({
          key: `${c.row}:${c.hour}`,
          cells: [
            `${WEEKDAYS[c.row]} ${String(c.hour).padStart(2, '0')}:00 UTC`,
            fmt(c.value),
            <Delta
              key="d"
              mode="vsMedian"
              value={grid.median ? c.value / grid.median - 1 : null}
            />,
          ],
        }))
      : [...grid.cells].reverse().map((c) => ({
          key: c.day ?? 0,
          cells: [
            formatDayLong(c.day ?? 0),
            fmt(c.value),
            <Delta
              key="d"
              mode="vsMedian"
              value={grid.median ? c.value / grid.median - 1 : null}
            />,
          ],
        }))
    body = (
      <>
        <DivergingLegend labels={LEGEND[kind]} />
        <ChartFigure
          clientOnly={false}
          summary={summary}
          footer={
            <p className="text-muted-foreground">
              {[caption, 'Bigger dots mean higher values.', note, ...notes]
                .filter(Boolean)
                .join(' ')}
            </p>
          }
          table={() => (
            <StatTable
              caption={`${TITLE[kind]}, ${name}`}
              head={[
                useHourly ? 'Weekday and hour' : 'Day',
                kind === 'value' ? 'Market value' : 'Sold per day',
                'vs median',
              ]}
              rows={rows}
            />
          )}
        >
          <DotHeatmap grid={grid} label={summary} />
        </ChartFigure>
      </>
    )
  }

  return (
    <StatCard title={TITLE[kind]} range={range} onRangeChange={onRangeChange}>
      {body}
      {daily.length < MIN_DAYS && !useHourly && notes.length > 0 && (
        <p className="text-sm text-muted-foreground">{notes.join(' ')}</p>
      )}
    </StatCard>
  )
}
