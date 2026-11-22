import { REGION_INFO } from '#/config/regions'
import { ChartFigure } from '#/components/chart-figure'
import { Delta } from '#/components/delta'
import { Money } from '#/components/money'
import { m } from '#/paraglide/messages.js'
import { binFill, binInk, binOf } from '#/lib/bins'
import {
  dayOf,
  formatDate,
  formatDayLong,
  formatNumber,
  formatPct,
} from '#/lib/format'
import type { Region, StatRange } from '#/lib/search'
import type { HistoryPoint, ItemHistory } from '#/server/types'
import { CardNote, StatCard, StatTable } from './stat-card'
import type { DotGrid } from './stats'
import {
  RANGE_DAYS,
  dailyGrid,
  heatmapSummary,
  hourlyGrid,
  inRange,
  rangeNote,
} from './stats'

const CELL = 44
const SQUARE = 40
const LEFT = 32
const TOP = 20
const MIN_DAYS = 7

/** Weekday heatmap: one square per cell, coloured by the diverging bin vs the median. */
export function DotHeatmap({ grid, label }: { grid: DotGrid; label: string }) {
  const width = LEFT + grid.columns.length * CELL
  const height = TOP + grid.rows.length * CELL
  return (
    <div className="relative overflow-x-auto">
      <svg
        role="img"
        aria-label={label}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="text-muted-foreground"
      >
        {grid.columns.map((c, i) => (
          <text
            key={c.key}
            x={LEFT + i * CELL + CELL / 2}
            y={TOP - 6}
            textAnchor="middle"
            className="fill-current text-micro"
          >
            {c.label}
          </text>
        ))}
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
          const bin = binOf(ratio)
          const cx = LEFT + c.col * CELL + CELL / 2
          const cy = TOP + c.row * CELL + CELL / 2
          return (
            <g key={`${c.col}:${c.row}`}>
              <rect
                x={cx - SQUARE / 2}
                y={cy - SQUARE / 2}
                width={SQUARE}
                height={SQUARE}
                rx={3}
                fill={binFill(bin ?? 0)}
                stroke="var(--input)"
                strokeWidth={1}
              />
              {ratio !== null && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={`var(${binInk(bin)})`}
                  className="text-[11px] tabular-nums"
                >
                  {formatPct(ratio, { decimals: 0 })}
                </text>
              )}
            </g>
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
  value: m.item_heatmapValueTitle,
  sales: m.item_heatmapSalesTitle,
}

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
  const title = TITLE[kind]()
  const days = RANGE_DAYS[range]
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
      m.item_hourlyPending({
        realm: realmName,
        min: MIN_DAYS,
        n: hourly?.days ?? 0,
      }),
    )
  }
  if (kind === 'sales' && realmName) {
    notes.push(m.item_salesRegionOnly())
  }

  let body
  if (!useHourly && daily.length < MIN_DAYS) {
    const firstWeekEnds = (points[0]?.day ?? 0) + MIN_DAYS - 1
    body = (
      <CardNote title={m.item_heatmapNeedsWeek()}>
        <p>
          {m.item_heatmapProgress({
            n: daily.length,
            min: MIN_DAYS,
            region: name,
          })}{' '}
          {points.length >= MIN_DAYS
            ? m.item_heatmapPickRange()
            : m.item_heatmapFirstWeek({ date: formatDate(firstWeekEnds) })}
        </p>
      </CardNote>
    )
  } else if (kind === 'sales' && daily.every((d) => d.value === 0)) {
    body = (
      <CardNote title={m.item_noSalesTitle()}>
        <p>{m.item_noSalesBody({ region: name, days })}</p>
      </CardNote>
    )
  } else {
    const grid = useHourly ? hourly : dailyGrid(daily)
    const summary = heatmapSummary(grid, range)
    const caption = useHourly
      ? m.item_heatmapHourlyCaption({ realm: realmName ?? '', days: grid.days })
      : kind === 'sales'
        ? m.item_heatmapSalesCaption({ days })
        : m.item_heatmapValueCaption({ days })
    const note = useHourly ? null : rangeNote(range, points.length)
    const fmt = (v: number) =>
      kind === 'value' ? (
        <Money copper={Math.round(v)} />
      ) : (
        m.item_perDay({ n: formatNumber(v, 1) })
      )
    const reference = useHourly
      ? m.item_medianHourReference()
      : m.item_rangeMedianReference({ days })
    // newest first; hourly slots go by weekday then hour
    const rows = useHourly
      ? grid.cells.map((c) => ({
          key: `${c.row}:${c.hour}`,
          cells: [
            m.item_hourSlot({
              weekday: c.row,
              hour: String(c.hour).padStart(2, '0'),
            }),
            fmt(c.value),
            <Delta
              key="d"
              mode="vsMedian"
              reference={reference}
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
              reference={reference}
              value={grid.median ? c.value / grid.median - 1 : null}
            />,
          ],
        }))
    body = (
      <>
        <ChartFigure
          clientOnly={false}
          summary={summary}
          footer={
            <p className="text-muted-foreground">
              {[caption, note, ...notes].filter(Boolean).join(' ')}
            </p>
          }
          table={() => (
            <StatTable
              caption={m.item_tableCaption({ title, scope: name })}
              head={[
                useHourly ? m.item_weekdayHourColumn() : m.item_dayColumn(),
                kind === 'value'
                  ? m.shell_glossaryMarketValueLabel()
                  : m.shell_glossarySoldPerDayLabel(),
                m.item_vsMedianColumn(),
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
    <StatCard title={title} range={range} onRangeChange={onRangeChange}>
      {body}
      {daily.length < MIN_DAYS && !useHourly && notes.length > 0 && (
        <p className="text-sm text-muted-foreground">{notes.join(' ')}</p>
      )}
    </StatCard>
  )
}
