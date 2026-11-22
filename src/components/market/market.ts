import { m } from '#/i18n'
import { binOf } from '#/lib/bins'
import type { MoverBy, MoverMetric, Region } from '#/lib/search'
import type { MoversInput } from '#/server/fns/inputs'
import type { MoversResult } from '#/server/types'

type Available = MoversResult['available']

/**
 * The window the charts actually show. TSM has no 60-day sales average, so
 * Popularity turns vs_hist into d7, else d1, else nothing. An unavailable
 * price window falls back to vs_hist, which works from day one.
 */
export function resolveWindow(
  by: MoverBy,
  requested: MoverMetric,
  available: Available,
): MoverMetric | null {
  if (by === 'price') {
    return requested === 'vs_hist' || available[requested]
      ? requested
      : 'vs_hist'
  }
  if (requested !== 'vs_hist' && available[requested]) {
    return requested
  }
  return available.d7 ? 'd7' : available.d1 ? 'd1' : null
}

/** First movers read: a valid input whose `available` decides the window. */
export function probeInput(
  region: Region,
  by: MoverBy,
  requested: MoverMetric,
): MoversInput {
  const metric = by === 'sales' && requested === 'vs_hist' ? 'd1' : requested
  return { region, by, metric, dir: 1 }
}

/** Bar length against the largest change in its own chart. */
export const barWidth = (change: number, max: number) =>
  `max(2px, ${max > 0 ? (Math.abs(change) / max) * 100 : 0}%)`

export type MapMetric = 'vs_hist' | 'd1'

/** The map follows d1 only for price with d1 available; popularity never colours it. */
export const mapMetric = (
  by: MoverBy,
  window: MoverMetric | null,
  d1Available: boolean,
): MapMetric =>
  by === 'price' && window === 'd1' && d1Available ? 'd1' : 'vs_hist'

export function mapSummary(values: (number | null)[], metric: MapMetric) {
  const bins = values.map(binOf)
  const up = bins.filter((b) => b !== null && b > 0).length
  const down = bins.filter((b) => b !== null && b < 0).length
  const counts = { n: values.length, up, down }
  return metric === 'd1'
    ? m.market.mapSummaryD1(counts)
    : m.market.mapSummaryVsHist(counts)
}
