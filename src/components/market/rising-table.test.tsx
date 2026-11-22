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
import type { RisingRow } from '#/server/types'
import { RisingTable } from './rising-table'

// the fns module reaches the D1 binding; RisingTable only takes rows
vi.mock('#/server/fns/market', () => ({ risingQuery: vi.fn() }))

afterEach(cleanup)

function withRouter(ui: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => ui }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(<RouterProvider router={router} />)
}

const row = (id: number, change: number): RisingRow => ({
  id,
  name: `Item ${id}`,
  mv: 12_000,
  change,
  spd: 8,
  avgSpd: 5,
  lift: 1.6,
})

const NOV_22 = 20_779

describe('RisingTable', () => {
  it('lists rows in the order given with the price change and sales lift', async () => {
    withRouter(
      <RisingTable
        region="eu"
        rows={[row(2, 0.5), row(1, 0.1)]}
        days={30}
        lastDay={NOV_22}
      />,
    )
    const table = await screen.findByRole('table')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(
      rows.map((r) => within(r).getByRole('rowheader').textContent),
    ).toEqual(['Item 2', 'Item 1'])
    expect(rows[0].textContent).toContain('up 50.0 percent')
    expect(rows[0].textContent).toContain('1.6× usual')
  })

  it('says when it starts while the region has under 14 earlier days', async () => {
    withRouter(<RisingTable region="eu" rows={[]} days={5} lastDay={NOV_22} />)
    expect(
      await screen.findByText(/Starts on 2 Dec 2026 \(4 of 14 days so far\)/),
    ).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('says so plainly when nothing qualifies', async () => {
    withRouter(<RisingTable region="eu" rows={[]} days={30} lastDay={NOV_22} />)
    expect(
      await screen.findByText(/No item is rising with demand today/),
    ).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })
})
