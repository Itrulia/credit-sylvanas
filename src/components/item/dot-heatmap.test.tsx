// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { HistoryPoint, ItemHistory } from '#/server/types'
import { HeatmapCard } from './dot-heatmap'

afterEach(cleanup)

const START = Date.parse('2026-11-02T00:00:00Z') / 86_400_000 // a Monday
const points = (n: number, spd = (i: number) => 3 + (i % 7)): HistoryPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    day: START + i,
    mv: 10_000 + (i % 7) * 500,
    hist: 10_000,
    asp: 9_000,
    spd: spd(i),
  }))
const realmScans = (days: number): NonNullable<ItemHistory['realm']> => ({
  daily: [],
  scans: Array.from({ length: days * 2 }, (_, i) => ({
    t: (START + Math.floor(i / 2)) * 86_400 + (i % 2 ? 14 : 2) * 3600,
    mv: 9_000 + i * 10,
  })),
})

const base = {
  region: 'us' as const,
  range: '90d' as const,
  onRangeChange: vi.fn(),
  realm: null,
  realmName: null,
}

describe('HeatmapCard', () => {
  it('shows the week-of-history empty state with 6 daily points', () => {
    render(<HeatmapCard {...base} kind="value" points={points(6)} />)
    expect(
      screen.getByText('The heatmap needs a week of daily updates.'),
    ).toBeTruthy()
    expect(screen.getByText(/We have 6 of 7 for this item in US/)).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('suggests a longer range when the short range is what hides the grid', () => {
    const history = points(30).filter((_, i) => i < 20 || i === 29)
    render(<HeatmapCard {...base} range="7d" kind="value" points={history} />)
    expect(screen.getByText(/Pick 30D or 90D to see more/)).toBeTruthy()
  })

  it('draws the daily grid with 7 points and a dot per day', () => {
    render(<HeatmapCard {...base} kind="value" points={points(7)} />)
    const svg = screen.getByRole('img')
    expect(svg.getAttribute('aria-label')).toMatch(/^Highest on Sundays/)
    expect(svg.querySelectorAll('circle')).toHaveLength(7)
    expect(screen.getByText(/Each dot is one day/)).toBeTruthy()
  })

  it('lists the same rows in the table toggle as the chart draws', async () => {
    render(<HeatmapCard {...base} kind="value" points={points(10)} />)
    const dots = screen.getByRole('img').querySelectorAll('circle').length
    await userEvent.click(screen.getByRole('button', { name: 'Show as table' }))
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(dots + 1)
    expect(table.textContent).toMatch(/the 90-day median/)
    expect(table.textContent).not.toMatch(/cross-region/)
  })

  it('switches card 3 to the hourly layout at 7 realm days', () => {
    render(
      <HeatmapCard
        {...base}
        kind="value"
        points={points(14)}
        realm={realmScans(7)}
        realmName="Nightslayer"
      />,
    )
    expect(
      screen.getByText(/weekday and hour \(UTC\) on Nightslayer, from 7 days/),
    ).toBeTruthy()
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(
      /:00 UTC/,
    )
  })

  it('stays daily with 6 realm days and says when hourly starts', () => {
    render(
      <HeatmapCard
        {...base}
        kind="value"
        points={points(14)}
        realm={realmScans(6)}
        realmName="Nightslayer"
      />,
    )
    expect(
      screen.getByText(
        /Hourly view for Nightslayer starts after 7 days of scans \(6 so far\)\./,
      ),
    ).toBeTruthy()
    expect(screen.getByRole('img').querySelectorAll('circle')).toHaveLength(14)
  })

  it('shows no recorded sales on card 4 when every value is 0', () => {
    render(<HeatmapCard {...base} kind="sales" points={points(14, () => 0)} />)
    expect(screen.getByText('No recorded sales in this range.')).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('keeps card 4 region-wide with a realm', () => {
    render(
      <HeatmapCard
        {...base}
        kind="sales"
        points={points(14)}
        realm={realmScans(7)}
        realmName="Nightslayer"
      />,
    )
    expect(screen.getByText(/Sales are only published per region/)).toBeTruthy()
    expect(screen.getByText(/Fewer sales than usual/)).toBeTruthy()
  })
})
