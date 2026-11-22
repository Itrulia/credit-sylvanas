// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import type { MoverRow } from '#/server/types'
import { MoverChart } from './mover-bars'

// the fns module reaches the D1 binding; MoverChart only takes rows
vi.mock('#/server/fns/market', () => ({ moversQuery: vi.fn() }))

afterEach(cleanup)

function withRouter(ui: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => ui }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(<RouterProvider router={router} />)
}

const row = (id: number, change: number, from = 100, to = 120): MoverRow => ({
  id,
  name: `Item ${id}`,
  mv: to,
  hist: from,
  spd: 3,
  change,
  from,
  to,
})

const bars = (table: HTMLElement) =>
  Array.from(table.querySelectorAll<HTMLElement>('[data-bar]'))

describe('MoverChart', () => {
  it('sizes bars against the largest change and hides them from screen readers', async () => {
    withRouter(
      <MoverChart
        region="us"
        dir={1}
        by="price"
        window="d1"
        rows={[row(1, 0.4), row(2, 0.2), row(3, 0.1)]}
      />,
    )
    const table = await screen.findByRole('table')
    expect(bars(table).map((b) => b.style.width)).toEqual([
      'max(2px, 100%)',
      'max(2px, 50%)',
      'max(2px, 25%)',
    ])
    for (const bar of bars(table)) {
      expect(bar.closest('[aria-hidden="true"]')).not.toBeNull()
    }
    const first = table.querySelector<HTMLElement>('tbody tr')!
    expect(within(first).getByRole('rowheader').textContent).toBe('Item 1')
    expect(within(first).getByRole('link', { name: 'Item 1' })).toBeTruthy()
    expect(first.querySelector('.sr-only')?.textContent).toBe('up 40.0 percent')
  })

  it('says how many moved when fewer than 10 rows qualify', async () => {
    withRouter(
      <MoverChart
        region="us"
        dir={-1}
        by="price"
        window="vs_hist"
        rows={[row(1, -0.3), row(2, -0.1)]}
      />,
    )
    const table = await screen.findByRole('table')
    expect(table.querySelector('caption')?.textContent).toBe(
      'Top 2 US items by price decrease, against the 60-day average. Only 2 items moved more than 0.5%.',
    )
    expect(table.querySelector('tbody .sr-only')?.textContent).toBe(
      '30.0 percent below 60-day average',
    )
  })

  it('shows the from and to sold per day for popularity', async () => {
    withRouter(
      <MoverChart
        region="eu"
        dir={1}
        by="sales"
        window="d7"
        rows={[row(1, 1, 2, 4)]}
      />,
    )
    const table = await screen.findByRole('table')
    expect(table.textContent).toContain('2 → 4 a day')
  })

  it('renders an empty state instead of a table when nothing moved', async () => {
    withRouter(
      <MoverChart region="us" dir={1} by="price" window="d7" rows={[]} />,
    )
    expect(
      await screen.findByText(
        'Nothing moved more than 0.5% over the last 7 days.',
      ),
    ).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Biggest increase' }),
    ).toBeTruthy()
  })
})
