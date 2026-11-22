import { describe, expect, it } from 'vitest'
import {
  compareSummary,
  dailyGrid,
  dotRadius,
  heatmapSummary,
  hourlyGrid,
  inRange,
  mondayOf,
  rangeNote,
  rangeMedian,
  realmCompareSummary,
  valueSummary,
  weekdayOf,
} from './stats'

const d = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000
const t = (iso: string) => Date.parse(iso) / 1000
const days = (from: string, n: number, value: (i: number) => number) =>
  Array.from({ length: n }, (_, i) => ({ day: d(from) + i, value: value(i) }))

describe('inRange', () => {
  const pts = Array.from({ length: 90 }, (_, i) => ({ day: 1000 + i }))
  it.each([
    ['7d', 7, 1083],
    ['30d', 30, 1060],
    ['90d', 90, 1000],
  ] as const)('%s keeps the last %i days', (range, n, first) => {
    const out = inRange(pts, range)
    expect(out).toHaveLength(n)
    expect(out[0].day).toBe(first)
    expect(out.at(-1)?.day).toBe(1089)
  })

  it('cuts by calendar days, not point count, when days are missing', () => {
    const sparse = [{ day: 1000 }, { day: 1080 }, { day: 1085 }, { day: 1089 }]
    expect(inRange(sparse, '7d').map((p) => p.day)).toEqual([1085, 1089])
  })

  it('anchors to a given end day', () => {
    expect(inRange(pts, '7d', 1095).map((p) => p.day)).toEqual([1089])
  })

  it('returns nothing for no points', () => {
    expect(inRange([], '30d')).toEqual([])
  })
})

describe('weekdays and ISO weeks', () => {
  it('maps day numbers to Monday-first weekdays', () => {
    expect(weekdayOf(d('2026-11-23'))).toBe(0) // Monday
    expect(weekdayOf(d('2026-11-22'))).toBe(6) // Sunday
    expect(mondayOf(d('2026-11-22'))).toBe(d('2026-11-16'))
  })
})

describe('dailyGrid', () => {
  it('builds one column per ISO week across a month boundary', () => {
    const pts = days('2026-10-28', 10, (i) => 100 + i) // Wed 28 Oct to Fri 6 Nov
    const grid = dailyGrid(pts)
    expect(grid.columns.map((c) => c.label)).toEqual(['26 Oct', '2 Nov'])
    expect(grid.rows).toHaveLength(7)
    const first = grid.cells[0]
    expect(first).toMatchObject({ col: 0, row: 2, value: 100 })
    const last = grid.cells.at(-1)
    expect(last).toMatchObject({ col: 1, row: 4, value: 109 })
    expect(grid.cells).toHaveLength(10)
  })

  it('draws nothing for days without a snapshot', () => {
    const grid = dailyGrid([
      { day: d('2026-11-02'), value: 1 },
      { day: d('2026-11-05'), value: 2 },
    ])
    expect(grid.cells.map((c) => c.row)).toEqual([0, 3])
  })

  it('uses the median of the values as the reference', () => {
    const grid = dailyGrid(
      days('2026-11-02', 7, (i) => [5, 1, 3, 9, 7, 2, 4][i]),
    )
    expect(grid.median).toBe(4)
  })
})

describe('hourlyGrid', () => {
  it('builds columns only from the scan hours present and averages each slot', () => {
    const scans = [
      { t: t('2026-11-02T02:10:00Z'), mv: 100 },
      { t: t('2026-11-09T02:40:00Z'), mv: 200 }, // also Monday 02h
      { t: t('2026-11-02T08:05:00Z'), mv: 300 },
      { t: t('2026-11-04T23:59:00Z'), mv: 400 },
    ]
    const grid = hourlyGrid(scans)
    expect(grid.columns.map((c) => c.label)).toEqual(['02', '08', '23'])
    expect(grid.cells).toContainEqual(
      expect.objectContaining({ col: 0, row: 0, value: 150, hour: 2 }),
    )
    expect(grid.cells).toContainEqual(
      expect.objectContaining({ col: 2, row: 2, value: 400, hour: 23 }),
    )
    expect(grid.cells).toHaveLength(3)
    expect(grid.days).toBe(3)
  })
})

describe('rangeMedian and dotRadius', () => {
  it('returns null for an empty set', () => {
    expect(rangeMedian([])).toBeNull()
  })

  it('scales the area with the value and clamps the radius to 3..11px', () => {
    expect(dotRadius(100, 100)).toBe(7)
    expect(dotRadius(400, 100)).toBe(11) // 14 clamped
    expect(dotRadius(1, 100)).toBe(3) // 0.7 clamped
    expect(dotRadius(0, 100)).toBe(3)
    expect(dotRadius(200, 100)).toBeCloseTo(9.9, 1)
    expect(dotRadius(5, 0)).toBe(3)
  })
})

describe('summary sentences', () => {
  it('describes a rise in market value with low and sales', () => {
    const pts = [
      { day: d('2026-11-01'), mv: 10_000, spd: 4 },
      { day: d('2026-11-02'), mv: 8_000, spd: 6 },
      { day: d('2026-11-03'), mv: 12_000, spd: 5 },
    ]
    expect(valueSummary(pts)).toBe(
      'Market value rose 20.0% over 3 days, from 1g to 1g 20s. Low 80s on 2 Nov. Sold about 5 a day on average.',
    )
  })

  it('describes a fall and leaves out sales for realm data', () => {
    const pts = [
      { day: d('2026-11-01'), mv: 20_000 },
      { day: d('2026-11-10'), mv: 15_000 },
    ]
    expect(valueSummary(pts)).toBe(
      'Market value fell 25.0% over 10 days, from 2g to 1g 50s. Low 1g 50s on 10 Nov.',
    )
  })

  it('calls a flat series steady instead of a 0% rise', () => {
    const pts = [
      { day: d('2026-11-01'), mv: 1, spd: 2 },
      { day: d('2026-11-30'), mv: 1, spd: 2 },
    ]
    expect(valueSummary(pts)).toBe(
      'Market value held steady at 1c over 30 days. Low 1c on 1 Nov. Sold about 2 a day on average.',
    )
  })

  it('says no weekday stands out when every slot sits at the median', () => {
    const grid = dailyGrid(days('2026-11-02', 14, () => 5))
    expect(heatmapSummary(grid, '90d')).toBe(
      'Every day sits within 0.5% of the 90-day median, so no weekday stands out.',
    )
  })

  it('compares the region with the daily cross-region median', () => {
    const own = [
      { day: 1, mv: 110 },
      { day: 2, mv: 110 },
    ]
    const others = [
      {
        region: 'eu' as const,
        points: [
          { day: 1, mv: 100 },
          { day: 2, mv: 100 },
        ],
      },
      {
        region: 'kr' as const,
        points: [
          { day: 1, mv: 100 },
          { day: 2, mv: 100 },
        ],
      },
    ]
    expect(compareSummary(own, others, 'us', 30)).toBe(
      'In the last 30 days US averaged 10.0% above the median of 3 regions.',
    )
    expect(
      compareSummary(
        own.map((p) => ({ ...p, mv: p.mv - 25 })),
        others,
        'us',
        7,
      ),
    ).toBe(
      'In the last 7 days US averaged 15.0% below the median of 3 regions.',
    )
  })

  it('compares a realm with the region market value', () => {
    const realm = [
      { day: 1, mv: 90 },
      { day: 2, mv: 90 },
    ]
    const region = [
      { day: 1, mv: 100 },
      { day: 2, mv: 100 },
    ]
    expect(realmCompareSummary(realm, region, 'Nightslayer', 'us')).toBe(
      'Nightslayer averaged 10.0% below the US market value.',
    )
  })

  it('names the highest and lowest weekday for the daily layout', () => {
    // Mon..Sun, two weeks
    const values = [10, 8, 10, 10, 10, 14, 10, 10, 8, 10, 10, 10, 14, 10]
    const grid = dailyGrid(days('2026-11-02', 14, (i) => values[i]))
    expect(heatmapSummary(grid, '30d')).toBe(
      'Highest on Saturdays, on average 40.0% above the 30-day median. Lowest on Tuesdays, 20.0% below.',
    )
  })

  it('names the highest and lowest slot for the hourly layout', () => {
    const grid = hourlyGrid([
      { t: t('2026-11-02T02:00:00Z'), mv: 100 },
      { t: t('2026-11-03T05:00:00Z'), mv: 150 },
      { t: t('2026-11-04T08:00:00Z'), mv: 50 },
    ])
    expect(heatmapSummary(grid, '90d')).toBe(
      'Highest on Tuesdays at 05:00 UTC, 50.0% above the median. Lowest on Wednesdays at 08:00 UTC, 50.0% below.',
    )
  })

  it('says when the range asks for more days than we have', () => {
    expect(rangeNote('90d', 40)).toBe('Showing all 40 days we have.')
    expect(rangeNote('30d', 40)).toBeNull()
    expect(rangeNote('7d', 7)).toBeNull()
  })
})
