// Pure helpers for the item statistics cards (DESIGN §5): range filter,
// weekday and hour bucketing, dot radius and the summary sentences.
import { REGION_INFO } from '#/config/regions'
import { m } from '#/i18n'
import {
  DAY_SECONDS,
  formatDate,
  formatDay,
  formatNumber,
  formatPct,
} from '#/lib/format'
import { median } from '#/lib/median'
import { formatMoney, moneyText } from '#/lib/money'
import type { Region, StatRange } from '#/lib/search'

export const RANGE_DAYS: Record<StatRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}
export const RANGE_OPTIONS: {
  value: StatRange
  label: string
  long: string
}[] = (['7d', '30d', '90d'] as const).map((value) => ({
  value,
  label: m.item.rangeShort({ days: RANGE_DAYS[value] }),
  long: m.item.rangeLong({ days: RANGE_DAYS[value] }),
}))

/** Points within the last N calendar days up to `endDay` (default: the last point). */
export function inRange<T extends { day: number }>(
  points: readonly T[],
  range: StatRange,
  endDay = points.at(-1)?.day,
): T[] {
  if (endDay === undefined) {
    return []
  }
  const from = endDay - RANGE_DAYS[range] + 1
  return points.filter((p) => p.day >= from && p.day <= endDay)
}

export const rangeNote = (range: StatRange, daysWeHave: number) =>
  daysWeHave < RANGE_DAYS[range] ? m.item.rangeNote({ n: daysWeHave }) : null

/** Monday = 0 … Sunday = 6. Day 0 (1 Jan 1970) was a Thursday. */
export const weekdayOf = (day: number) => (((day + 3) % 7) + 7) % 7
export const mondayOf = (day: number) => day - weekdayOf(day)

export const WEEKDAYS = Array.from({ length: 7 }, (_, weekday) =>
  m.item.weekdayShort({ weekday }),
)

export interface DotCell {
  col: number
  row: number
  value: number
  /** daily layout */
  day?: number
  /** hourly layout, UTC */
  hour?: number
}

export interface DotGrid {
  layout: 'daily' | 'hourly'
  columns: { key: number; label: string }[]
  rows: string[]
  cells: DotCell[]
  median: number | null
  /** distinct days behind the grid */
  days: number
}

export const rangeMedian = (values: readonly number[]) => median(values)

/** 7 weekday rows by one column per ISO week; one dot per day with a value. */
export function dailyGrid(points: readonly { day: number; value: number }[]) {
  const first = points[0]?.day ?? 0
  const start = mondayOf(first)
  const weeks = points.length
    ? Math.floor((mondayOf(points.at(-1)!.day) - start) / 7) + 1
    : 0
  const grid: DotGrid = {
    layout: 'daily',
    columns: Array.from({ length: weeks }, (_, i) => ({
      key: start + i * 7,
      label: formatDay(start + i * 7),
    })),
    rows: WEEKDAYS,
    cells: points.map((p) => ({
      col: Math.floor((p.day - start) / 7),
      row: weekdayOf(p.day),
      value: p.value,
      day: p.day,
    })),
    median: rangeMedian(points.map((p) => p.value)),
    days: points.length,
  }
  return grid
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 7 weekday rows by one column per UTC scan hour seen; each cell the mean value. */
export function hourlyGrid(scans: readonly { t: number; mv: number }[]) {
  const slots = new Map<
    string,
    { row: number; hour: number; sum: number; n: number }
  >()
  const hours = new Set<number>()
  const days = new Set<number>()
  for (const s of scans) {
    const day = Math.floor(s.t / DAY_SECONDS)
    const hour = new Date(s.t * 1000).getUTCHours()
    const row = weekdayOf(day)
    hours.add(hour)
    days.add(day)
    const key = `${row}:${hour}`
    const slot = slots.get(key) ?? { row, hour, sum: 0, n: 0 }
    slot.sum += s.mv
    slot.n += 1
    slots.set(key, slot)
  }
  const cols = [...hours].sort((a, b) => a - b)
  const cells = [...slots.values()]
    .map((s) => ({
      col: cols.indexOf(s.hour),
      row: s.row,
      value: s.sum / s.n,
      hour: s.hour,
    }))
    .sort((a, b) => a.row - b.row || a.col - b.col)
  const grid: DotGrid = {
    layout: 'hourly',
    columns: cols.map((h) => ({ key: h, label: pad(h) })),
    rows: WEEKDAYS,
    cells,
    median: rangeMedian(cells.map((c) => c.value)),
    days: days.size,
  }
  return grid
}

// within +-0.5% counts as flat, as in <Delta>
const FLAT = 0.005
const money = (copper: number) => moneyText(formatMoney(copper))
const pct = (ratio: number) => formatPct(ratio, { sign: false })
const mean = (values: readonly number[]) =>
  values.reduce((a, b) => a + b, 0) / values.length

/** Card 1 summary. Pass `spd` for region points; realm points have no sales. */
export function valueSummary(
  points: readonly { day: number; mv: number; spd?: number }[],
) {
  const last = points.at(-1)
  if (!last) {
    return ''
  }
  const first = points[0]
  const n = last.day - first.day + 1
  const change = first.mv > 0 ? last.mv / first.mv - 1 : 0
  const low = points.reduce((a, b) => (b.mv < a.mv ? b : a))
  const parts = [
    Math.abs(change) < FLAT
      ? m.item.valueSteady({ value: money(last.mv), n })
      : m.item.valueChanged({
          fell: change < 0,
          pct: pct(change),
          n,
          from: money(first.mv),
          to: money(last.mv),
        }),
    m.item.valueLow({ value: money(low.mv), date: formatDay(low.day) }),
  ]
  const sales = points.flatMap((p) => (p.spd === undefined ? [] : [p.spd]))
  if (sales.length) {
    const avg = mean(sales)
    parts.push(m.item.valueSold({ n: formatNumber(avg, avg < 10 ? 1 : 0) }))
  }
  return parts.join(' ')
}

type Series = readonly { day: number; mv: number }[]

/** Mean of own / median(all regions that day) - 1, over days with 2+ regions. */
export function compareSummary(
  own: Series,
  others: readonly { region: Region; points: Series }[],
  region: Region,
  days: number,
) {
  const ratios: number[] = []
  for (const p of own) {
    const values = [
      p.mv,
      ...others.flatMap((o) =>
        o.points.filter((q) => q.day === p.day).map((q) => q.mv),
      ),
    ]
    const mid = median(values)
    if (values.length >= 2 && mid) {
      ratios.push(p.mv / mid - 1)
    }
  }
  const k = 1 + others.filter((o) => o.points.length >= 2).length
  const avg = ratios.length ? mean(ratios) : 0
  return m.item.compareSummary({
    days,
    region: REGION_INFO[region].name,
    pct: pct(avg),
    below: avg < 0,
    k,
  })
}

export function realmCompareSummary(
  realm: Series,
  regionPoints: Series,
  realmName: string,
  region: Region,
) {
  const byDay = new Map(regionPoints.map((p) => [p.day, p.mv]))
  const ratios = realm.flatMap((p) => {
    const r = byDay.get(p.day)
    return r ? [p.mv / r - 1] : []
  })
  const avg = ratios.length ? mean(ratios) : 0
  return m.item.realmCompareSummary({
    realm: realmName,
    pct: pct(avg),
    below: avg < 0,
    region: REGION_INFO[region].name,
  })
}

/**
 * Highest and lowest slot. Hourly realm scans can show a weekday and hour
 * pattern; daily region values are TSM multi-day averages, so the daily
 * layout names days, never a weekday.
 */
export function heatmapSummary(grid: DotGrid, range: StatRange) {
  if (!grid.median || grid.cells.length === 0) {
    return ''
  }
  const ref = grid.median
  const slots = grid.cells.map((c) => ({
    label:
      grid.layout === 'hourly'
        ? m.item.hourlySlotLabel({ weekday: c.row, hour: pad(c.hour ?? 0) })
        : formatDate(c.day ?? 0),
    value: c.value,
  }))
  const hi = slots.reduce((a, b) => (b.value > a.value ? b : a))
  const lo = slots.reduce((a, b) => (b.value < a.value ? b : a))
  const hiR = hi.value / ref - 1
  const loR = lo.value / ref - 1
  if (Math.abs(hiR) < FLAT && Math.abs(loR) < FLAT) {
    return grid.layout === 'hourly'
      ? m.item.heatmapFlatHourly()
      : m.item.heatmapFlatDaily({ days: RANGE_DAYS[range] })
  }
  const extremes = {
    hi: hi.label,
    hiPct: pct(hiR),
    hiBelow: hiR < 0,
    lo: lo.label,
    loPct: pct(loR),
    loBelow: loR < 0,
  }
  return grid.layout === 'hourly'
    ? m.item.heatmapHourlySummary(extremes)
    : m.item.heatmapDailySummary({ ...extremes, days: RANGE_DAYS[range] })
}
