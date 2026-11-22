import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartFigure } from '#/components/chart-figure'
import { Money } from '#/components/money'
import { ChartContainer } from '#/components/ui/chart'
import { m } from '#/paraglide/messages.js'
import { formatDate, formatDayLong, formatNumber } from '#/lib/format'
import type { Region, StatRange } from '#/lib/search'
import type { HistoryPoint, ItemHistory } from '#/server/types'
import {
  CHART_HEIGHT,
  ChartTip,
  axisMoney,
  dayTicks,
  endDot,
  endLabel,
  moneyDomain,
  tickDay,
} from './chart-parts'
import { CardNote, StatCard, StatTable } from './stat-card'
import { inRange, rangeNote, valueSummary } from './stats'

const C = {
  mv: 'var(--chart-1)',
  hist: 'var(--chart-2)',
  spd: 'var(--chart-4)',
  realm: 'var(--chart-3)',
  tomato: 'var(--brand-tomato)',
}

export interface ValueQuantityCardProps {
  points: HistoryPoint[]
  realm: ItemHistory['realm']
  realmName: string | null
  region: Region
  range: StatRange
  onRangeChange: (range: StatRange) => void
}

interface Row {
  day: number
  mv: number
  hist?: number
  spd?: number
  minBuyout?: number
}

/** Card 1: market value, 60-day average and sold/day (or realm value and lowest buyout). */
export function ValueQuantityCard({
  points,
  realm,
  realmName,
  region,
  range,
  onRangeChange,
}: ValueQuantityCardProps) {
  const isRealm = realm !== null && realmName !== null
  const all: Row[] = isRealm ? realm.daily : points
  const rows = inRange(all, range)
  const n = rows.length

  const title = m.item_valueTitle()
  let body
  if (n <= 1) {
    const only = rows[0] as Row | undefined
    body = only ? (
      <CardNote title={m.item_historyStarts({ date: formatDate(only.day) })}>
        <p>
          <Money copper={only.mv} />{' '}
          {m.item_onlyPointDate({ date: formatDayLong(only.day) })}
        </p>
        <p>{m.item_fillsInNote()}</p>
      </CardNote>
    ) : (
      <CardNote title={m.item_noRealmScans({ realm: realmName ?? '' })} />
    )
  } else {
    const days = rows.map((r) => r.day)
    const short = n <= 6
    const notes = [
      short ? m.item_historyNote({ n, date: formatDate(rows[0].day) }) : null,
      rangeNote(range, all.length),
      isRealm ? m.item_salesRegionOnly() : null,
    ]
    const tip = ({
      active,
      payload,
    }: {
      active?: boolean
      payload?: readonly { payload?: Row }[]
    }) => {
      const r = active ? payload?.[0]?.payload : undefined
      if (!r) {
        return null
      }
      return (
        <ChartTip
          day={r.day}
          rows={
            isRealm
              ? [
                  {
                    key: 'mv',
                    label: m.item_realmValueLabel(),
                    color: C.realm,
                    value: <Money copper={r.mv} />,
                  },
                  {
                    key: 'mb',
                    label: m.shell_glossaryMinBuyoutLabel(),
                    color: C.mv,
                    dash: '2 3',
                    value: <Money copper={r.minBuyout ?? null} />,
                  },
                ]
              : [
                  {
                    key: 'mv',
                    label: m.shell_glossaryMarketValueLabel(),
                    color: C.mv,
                    value: <Money copper={r.mv} />,
                  },
                  {
                    key: 'hist',
                    label: m.shell_glossaryHistoricalLabel(),
                    color: C.hist,
                    dash: '4 3',
                    value: <Money copper={r.hist ?? null} />,
                  },
                  {
                    key: 'spd',
                    label: m.shell_glossarySoldPerDayLabel(),
                    color: C.spd,
                    value: formatNumber(r.spd ?? 0, 1),
                  },
                ]
          }
        />
      )
    }
    body = (
      <ChartFigure
        height={CHART_HEIGHT + 24}
        summary={valueSummary(rows)}
        footer={
          <p className="text-muted-foreground">
            {notes.filter(Boolean).join(' ')}
          </p>
        }
        table={() => (
          <StatTable
            caption={m.item_tableCaption({
              title,
              scope: isRealm ? realmName : region.toUpperCase(),
            })}
            head={
              isRealm
                ? [
                    m.item_dayColumn(),
                    m.item_realmValueLabel(),
                    m.shell_glossaryMinBuyoutLabel(),
                  ]
                : [
                    m.item_dayColumn(),
                    m.shell_glossaryMarketValueLabel(),
                    m.shell_glossaryHistoricalLabel(),
                    m.shell_glossarySoldPerDayLabel(),
                  ]
            }
            rows={[...rows].reverse().map((r) => ({
              key: r.day,
              cells: isRealm
                ? [
                    formatDayLong(r.day),
                    <Money key="mv" copper={r.mv} />,
                    r.minBuyout ? (
                      <Money key="mb" copper={r.minBuyout} />
                    ) : (
                      m.item_noListings()
                    ),
                  ]
                : [
                    formatDayLong(r.day),
                    <Money key="mv" copper={r.mv} />,
                    <Money key="h" copper={r.hist ?? null} />,
                    formatNumber(r.spd ?? 0, 1),
                  ],
            }))}
          />
        )}
      >
        <div className="flex justify-between">
          <p className="text-label">{m.shell_glossaryMarketValueLabel()}</p>
          {!isRealm && (
            <p className="text-label">{m.shell_glossarySoldPerDayLabel()}</p>
          )}
        </div>
        <ChartContainer
          config={{}}
          className="aspect-auto w-full"
          style={{ height: CHART_HEIGHT }}
        >
          <ComposedChart
            data={rows}
            accessibilityLayer
            barCategoryGap="40%"
            margin={{ top: 8, right: 36, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="day"
              ticks={dayTicks(days)}
              tickFormatter={tickDay}
              tickLine={false}
              stroke="var(--chart-baseline)"
              className="text-micro"
            />
            <YAxis
              yAxisId="mv"
              domain={moneyDomain}
              tickFormatter={axisMoney}
              tickCount={5}
              tickLine={false}
              axisLine={false}
              width={56}
              className="text-micro"
            />
            {!isRealm && (
              <YAxis
                yAxisId="spd"
                orientation="right"
                domain={[0, 'auto']}
                tickFormatter={(v: number) => formatNumber(v)}
                tickCount={5}
                tickLine={false}
                axisLine={false}
                width={40}
                className="text-micro"
              />
            )}
            <Tooltip content={tip} isAnimationActive={false} />
            {!isRealm && (
              <Bar
                yAxisId="spd"
                dataKey="spd"
                name={m.shell_glossarySoldPerDayLabel()}
                fill={C.spd}
                isAnimationActive={false}
              />
            )}
            {isRealm ? (
              <>
                <Line
                  yAxisId="mv"
                  dataKey="minBuyout"
                  name={m.shell_glossaryMinBuyoutLabel()}
                  stroke={C.mv}
                  strokeWidth={1.5}
                  strokeDasharray="2 3"
                  dot={endDot(n, C.mv, C.mv, short)}
                  label={endLabel(n, m.item_endLabelBuyout(), C.mv)}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="mv"
                  dataKey="mv"
                  name={m.item_realmValueLabel()}
                  stroke={C.realm}
                  strokeWidth={2}
                  dot={endDot(n, C.realm, C.realm, short)}
                  label={endLabel(n, m.item_endLabelRealm(), C.realm)}
                  isAnimationActive={false}
                />
              </>
            ) : (
              <>
                <Line
                  yAxisId="mv"
                  dataKey="hist"
                  name={m.shell_glossaryHistoricalLabel()}
                  stroke={C.hist}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={endDot(n, C.hist, C.hist, short)}
                  label={endLabel(n, m.item_endLabelAvg(), C.hist)}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="mv"
                  dataKey="mv"
                  name={m.shell_glossaryMarketValueLabel()}
                  stroke={C.mv}
                  strokeWidth={2}
                  dot={endDot(n, C.mv, C.tomato, short)}
                  label={endLabel(n, m.item_endLabelValue(), C.mv)}
                  isAnimationActive={false}
                />
              </>
            )}
          </ComposedChart>
        </ChartContainer>
      </ChartFigure>
    )
  }

  return (
    <StatCard title={title} range={range} onRangeChange={onRangeChange}>
      {body}
    </StatCard>
  )
}
