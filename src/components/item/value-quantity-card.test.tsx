// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { HistoryPoint, ItemHistory } from '#/server/types'
import { renderToString } from 'react-dom/server'
import { ValueQuantityCard } from './value-quantity-card'

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(cleanup)

const START = Date.parse('2026-11-02T00:00:00Z') / 86_400_000
const points = (n: number): HistoryPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    day: START + i,
    mv: 10_000 + i * 100,
    hist: 10_000,
    asp: 9_000,
    spd: 4,
  }))
const base = {
  region: 'us' as const,
  range: '30d' as const,
  onRangeChange: vi.fn(),
}
const noRealm = { realm: null, realmName: null }

describe('ValueQuantityCard', () => {
  it('shows the dated value card with 1 point', () => {
    render(<ValueQuantityCard {...base} {...noRealm} points={points(1)} />)
    expect(screen.getByText('Price history starts 2 Nov 2026.')).toBeTruthy()
    expect(
      screen.getByText(/Check back tomorrow for the first trend/),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Show as table' })).toBeNull()
  })

  it('puts a dot on every point and states the history with 2 to 6 points', () => {
    render(<ValueQuantityCard {...base} {...noRealm} points={points(4)} />)
    expect(
      screen.getByText(/4 days of history \(since 2 Nov 2026\)/),
    ).toBeTruthy()
  })

  it('renders the chart in the server HTML', () => {
    const html = renderToString(
      <ValueQuantityCard {...base} {...noRealm} points={points(20)} />,
    )
    expect(html).toMatch(/<svg[^>]*class="[^"]*ts-chart/)
    expect(html).toContain('>Value<')
    expect(html).toContain('>Avg<')
  })

  it('draws a dot on every point of a short series, only the last otherwise', () => {
    const dots = (n: number) =>
      render(
        <ValueQuantityCard {...base} {...noRealm} points={points(n)} />,
      ).container.querySelectorAll('[data-ts-key^="end-dot"] circle')
    // two lines (value and 60-day average)
    expect(dots(4)).toHaveLength(8)
    cleanup()
    const long = dots(20)
    expect(long).toHaveLength(2)
    expect(
      [...long].some((c) => c.getAttribute('fill') === 'var(--brand-tomato)'),
    ).toBe(true)
  })

  it('draws a money axis and a sales axis for a region', () => {
    render(<ValueQuantityCard {...base} {...noRealm} points={points(20)} />)
    expect(screen.getByText('Market value', { selector: 'p' })).toBeTruthy()
    expect(screen.getByText('Sold per day', { selector: 'p' })).toBeTruthy()
    expect(screen.getByText(/Market value rose/)).toBeTruthy()
    expect(screen.getByText(/Showing all 20 days we have/)).toBeTruthy()
  })

  it('drops the bars and the second axis with a realm', async () => {
    const realm: NonNullable<ItemHistory['realm']> = {
      daily: Array.from({ length: 10 }, (_, i) => ({
        day: START + i,
        mv: 9_000 + i * 10,
        minBuyout: 8_000,
      })),
      scans: [],
    }
    render(
      <ValueQuantityCard
        {...base}
        points={points(10)}
        realm={realm}
        realmName="Nightslayer"
      />,
    )
    expect(screen.queryByText('Sold per day', { selector: 'p' })).toBeNull()
    expect(screen.getByText(/Sales are only published per region/)).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Show as table' }))
    const table = screen.getByRole('table')
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Day', 'Realm market value', 'Lowest buyout'])
    expect(within(table).getAllByRole('row')).toHaveLength(11)
  })

  it('lists the same days in the table as the chart draws', async () => {
    render(
      <ValueQuantityCard
        {...base}
        {...noRealm}
        range="7d"
        points={points(20)}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Show as table' }))
    const rows = within(screen.getByRole('table')).getAllByRole('row')
    expect(rows).toHaveLength(8)
    expect(rows[1].textContent).toContain('Sat 21 Nov 2026')
  })
})
