import { barY, defineChart, lineY } from '@tanstack/charts'
import { Chart } from '@tanstack/charts/react/tooltip'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { ChartFigure } from '#/components/chart-figure'
import { Money } from '#/components/money'
import { m } from '#/paraglide/messages.js'
import { formatDate, formatDayLong, formatNumber } from '#/lib/format'
import type { Region, StatRange } from '#/lib/search'
import type { HistoryPoint, ItemHistory } from '#/server/types'
import {
  CHART_HEIGHT,
  CHART_INITIAL_WIDTH,
  ChartTip,
  dayAxis,
  endMarks,
  moneyAxis,
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
    const tip = (r: Row | undefined) => {
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
    const lines = isRealm
      ? [
          {
            key: 'minBuyout',
            y: (r: Row) => r.minBuyout || null,
            color: C.mv,
            dash: '2 3',
            width: 1.5,
            label: m.item_endLabelBuyout(),
          },
          {
            key: 'mv',
            y: (r: Row) => r.mv,
            color: C.realm,
            width: 2,
            label: m.item_endLabelRealm(),
          },
        ]
      : [
          {
            key: 'hist',
            y: (r: Row) => r.hist,
            color: C.hist,
            dash: '4 3',
            width: 1.5,
            label: m.item_endLabelAvg(),
          },
          {
            key: 'mv',
            y: (r: Row) => r.mv,
            color: C.mv,
            lastFill: C.tomato,
            width: 2,
            label: m.item_endLabelValue(),
          },
        ]
    const definition = defineChart({
      marks: [
        ...(isRealm
          ? []
          : [
              barY(rows, {
                id: 'spd',
                x: 'day',
                y: (r) => r.spd ?? 0,
                yScale: 'spd',
                fill: C.spd,
              }),
            ]),
        ...lines.flatMap((l) => [
          lineY(rows, {
            id: l.key,
            x: 'day',
            y: l.y,
            stroke: l.color,
            strokeWidth: l.width,
            strokeDasharray: l.dash,
          }),
          ...endMarks(rows, { ...l, dots: short ? 'every' : 'last' }),
        ]),
      ],
      scales: {
        x: {
          // barCategoryGap 40%, lines sit on the band centres
          scale: scaleBand<number>().domain(days).padding(0.4),
          axis: dayAxis(days),
        },
        y: moneyAxis(rows.flatMap((r) => lines.map((l) => l.y(r)))),
        ...(isRealm
          ? {}
          : {
              spd: {
                channel: 'y' as const,
                scale: scaleLinear().domain([
                  0,
                  Math.max(1, ...rows.map((r) => r.spd ?? 0)),
                ]),
                nice: 5,
                side: 'right' as const,
                axis: {
                  line: false,
                  ticks: {
                    count: 5,
                    size: 0,
                    // room for the end labels between the plot and this axis
                    padding: 40,
                    format: (v: number) => formatNumber(v),
                  },
                },
              },
            }),
      },
      focus: 'group-x',
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: { use: tooltip, anchor: 'group-center' },
    })
    body = (
      <ChartFigure
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
        <Chart
          definition={definition}
          ariaLabel={title}
          height={CHART_HEIGHT}
          initialWidth={CHART_INITIAL_WIDTH}
          className="text-muted-foreground"
          renderTooltipBody={(ctx) => tip(ctx.points[0]?.datum)}
        />
      </ChartFigure>
    )
  }

  return (
    <StatCard title={title} range={range} onRangeChange={onRangeChange}>
      {body}
    </StatCard>
  )
}
