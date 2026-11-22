import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import type { HeatCell, HeatRow } from '#/server/types'

/** ItemLink needs a router; this renders `ui` as the only route. */
export function renderInRouter(ui: ReactNode) {
  const root = createRootRoute({ component: () => ui })
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(<RouterProvider router={router} />)
}

const cell = (mv: number, index: number | null): HeatCell => ({
  mv,
  hist: mv,
  index,
})

export function heatRow(
  id: number,
  name: string,
  over: Partial<HeatRow> = {},
): HeatRow {
  return {
    id,
    name,
    mv: 10_000,
    hist: 10_000,
    asp: 10_000,
    saleRate: 0.5,
    spd: 10,
    goldVolume: 100_000,
    vsHist: 0,
    d1: null,
    cells: {
      us: cell(10_000, 0.1),
      eu: cell(9_000, -0.1),
    },
    spread: 0.2,
    ...over,
  }
}
