import { describe, expect, it } from 'vitest'
import {
  dayOf,
  formatDate,
  formatDateTime,
  formatDay,
  formatDayLong,
  formatPct,
  isoFromDay,
} from './format'

const NOV22 = Date.UTC(2026, 10, 22, 4, 10) / 1000

describe('format', () => {
  it('formats percentages with a real minus and one decimal', () => {
    expect(formatPct(0.124)).toBe('+12.4%')
    expect(formatPct(-0.081)).toBe('−8.1%')
    expect(formatPct(0.0001)).toBe('0.0%')
    expect(formatPct(-0.12, { decimals: 0 })).toBe('−12%')
    expect(formatPct(0.12, { sign: false })).toBe('12.0%')
  })

  it('formats UTC dates in en-GB style', () => {
    expect(formatDateTime(NOV22)).toBe('22 Nov 2026, 04:10 UTC')
    const day = dayOf(NOV22)
    expect(formatDay(day)).toBe('22 Nov')
    expect(formatDate(day)).toBe('22 Nov 2026')
    expect(formatDayLong(day)).toBe('Sun 22 Nov 2026')
    expect(isoFromDay(day)).toBe('2026-11-22')
  })
})
