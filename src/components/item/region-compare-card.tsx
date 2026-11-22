import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { REGIONS, REGION_INFO } from '#/config/regions'
import { ChartFigure } from '#/components/chart-figure'
import { Money } from '#/components/money'
import { ChartContainer } from '#/components/ui/chart'
import { formatDate, formatDayLong } from '#/lib/format'
import type { Region, StatRange } from '#/lib/search'
import type { HistoryPoint, ItemHistory } from '#/server/types'
import {
  CHART_HEIGHT,
  ChartTip,
  Swatch,
  axisMoney,
  dayTicks,
  endDot,
  endLabel,
  moneyDomain,
  tickDay,
} from './chart-parts'
import { CardNote, StatCard, StatTable } from './stat-card'
import {
  compareSummary,
  inRange,
  rangeNote,
  realmCompareSummary,
} from './stats'

// fixed per region, so a region looks the same on every item
const DASH: Record<Region, string | undefined> = {
  us: undefined,
  eu: '6 3',
}

interface Series {
  key: string
  label: string
  legend: string
  color: string
  dash?: string
  width: number
  points: { day: number; mv: number }[]
}

export interface RegionCompareCardProps {
  points: HistoryPoint[]
  others: ItemHistory['others']
  realm: ItemHistory['realm']
  realmName: string | null
  region: Region
  range: StatRange
  onRangeChange: (range: StatRange) => void
}

/** Card 2: the item in every region (or this realm against the region). */
export function RegionCompareCard({
  points,
  others,
  realm,
  realmName,
  region,
  range,
  onRangeChange,
}: RegionCompareCardProps) {
  const isRealm = realm !== null && realmName !== null
  const title = isRealm ? 'This realm vs region' : 'Other regions'
  const name = REGION_INFO[region].name
  const end = points.at(-1)?.day
  const own = inRange(points, range, end)

  let series: Series[]
  let summary: string
  let empty = null
  if (isRealm) {
    const daily = inRange(realm.daily, range, end)
    series = [
      {
        key: 'realm',
        label: realmName,
        legend: realmName,
        color: 'var(--chart-3)',
        width: 2,
        points: daily,
      },
      {
        key: 'region',
        label: name,
        legend: `${name} region`,
        color: 'var(--chart-1)',
        dash: '6 3',
        width: 1.5,
        points: own,
      },
    ]
    summary = realmCompareSummary(daily, own, realmName, region)
    if (daily.length < 2) {
      const first = realm.daily[0] as { day: number } | undefined
      empty = (
        <CardNote
          title={
            first
              ? `${realmName} history starts ${formatDate(first.day)}.`
              : `${realmName} has no scans for this item yet.`
          }
        >
          <p>The comparison appears after the second day of realm scans.</p>
        </CardNote>
      )
    }
  } else {
    const byRegion = new Map<Region, { day: number; mv: number }[]>([
      [region, own],
      ...others.map((o) => [o.region, inRange(o.points, range, end)] as const),
    ])
    series = REGIONS.flatMap((r) => {
      const pts = byRegion.get(r) ?? []
      if (pts.length < 2) {
        return []
      }
      const current = r === region
      return [
        {
          key: r,
          label: REGION_INFO[r].name,
          legend: current
            ? `${REGION_INFO[r].name} (this region)`
            : REGION_INFO[r].name,
          color: `var(--region-${r})`,
          dash: DASH[r],
          width: current ? 2.5 : 1.5,
          points: pts,
        },
      ]
    })
    const span = own.length ? own.at(-1)!.day - own[0].day + 1 : 0
    summary = compareSummary(
      own,
      series
        .filter((s) => s.key !== region)
        .map((s) => ({ region: s.key as Region, points: s.points })),
      region,
      span,
    )
    if (series.length < 2) {
      empty = (
        <CardNote
          title={`Only ${name} has a price history for this item so far.`}
        >
          <p>
            Other regions appear here once they list it on two daily updates.
          </p>
        </CardNote>
      )
    }
  }

  const merged = new Map<number, Record<string, number>>()
  for (const s of series) {
    for (const p of s.points) {
      const row = merged.get(p.day) ?? { day: p.day }
      row[s.key] = p.mv
      merged.set(p.day, row)
    }
  }
  const rows = [...merged.values()].sort((a, b) => a.day - b.day)
  const count = rows.length

  const tip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: readonly { payload?: Record<string, number> }[]
  }) => {
    const r = active ? payload?.[0]?.payload : undefined
    return r ? (
      <ChartTip
        day={r.day}
        rows={series.map((s) => ({
          key: s.key,
          label: s.label,
          color: s.color,
          dash: s.dash,
          value: <Money copper={r[s.key] ?? null} />,
        }))}
      />
    ) : null
  }

  return (
    <StatCard title={title} range={range} onRangeChange={onRangeChange}>
      {empty ?? (
        <ChartFigure
          height={CHART_HEIGHT + 24}
          summary={summary}
          footer={
            <p className="text-muted-foreground">
              {[
                own.length <= 6
                  ? `${own.length} days of history (since ${formatDate(own[0].day)}).`
                  : null,
                rangeNote(range, points.length),
              ]
                .filter(Boolean)
                .join(' ')}
            </p>
          }
          table={() => (
            <StatTable
              caption={`${title}, market value by day`}
              head={['Day', ...series.map((s) => s.label)]}
              rows={[...rows].reverse().map((r) => ({
                key: r.day,
                cells: [
                  formatDayLong(r.day),
                  ...series.map((s) => (
                    <Money key={s.key} copper={r[s.key] ?? null} />
                  )),
                ],
              }))}
            />
          )}
        >
          <ul
            aria-label={isRealm ? 'Series' : 'Regions'}
            className="flex flex-wrap gap-x-4 gap-y-1 text-micro"
          >
            {series.map((s) => (
              <li key={s.key} className="inline-flex items-center gap-1.5">
                <Swatch color={s.color} dash={s.dash} />
                {s.legend}
              </li>
            ))}
          </ul>
          <ChartContainer
            config={{}}
            className="aspect-auto w-full"
            style={{ height: CHART_HEIGHT }}
          >
            <LineChart
              data={rows}
              accessibilityLayer
              margin={{ top: 8, right: 36, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey="day"
                ticks={dayTicks(rows.map((r) => r.day))}
                tickFormatter={tickDay}
                tickLine={false}
                stroke="var(--chart-baseline)"
                className="text-micro"
              />
              <YAxis
                domain={moneyDomain}
                tickFormatter={axisMoney}
                tickCount={5}
                tickLine={false}
                axisLine={false}
                width={56}
                className="text-micro"
              />
              <Tooltip content={tip} isAnimationActive={false} />
              {series.map((s) => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={s.width}
                  strokeDasharray={s.dash}
                  connectNulls
                  dot={
                    s.key === region || s.key === 'realm' || count <= 6
                      ? endDot(count, s.color)
                      : false
                  }
                  label={endLabel(count, s.label, s.color)}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </ChartFigure>
      )}
    </StatCard>
  )
}
