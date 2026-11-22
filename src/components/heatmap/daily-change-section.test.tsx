// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
} from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import type { DailyChange } from '#/server/types'
import { DailyChangeSection } from './daily-change-section'

let resolve: (d: DailyChange) => void = () => {}
const pending = new Promise<DailyChange>((r) => {
  resolve = r
})

vi.mock('#/server/fns/heatmap', () => ({
  dailyChangeQuery: (input: unknown) =>
    queryOptions({
      queryKey: ['getDailyChange', input],
      queryFn: () => pending,
    }),
}))

afterEach(cleanup)

// Structural, not timed: while the query is pending the skeleton is what renders.
it('shows the skeleton until the daily changes arrive, then the table', async () => {
  const root = createRootRoute({
    component: () => <DailyChangeSection region="us" n={10} busy={false} />,
  })
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  expect(await screen.findByText('Loading daily changes…')).toBeTruthy()
  expect(screen.queryByRole('table')).toBeNull()
  await act(async () => {
    resolve({
      available: true,
      cols: [20_000],
      rows: [{ id: 7, name: 'Copper Ore', d1: [0.2] }],
    })
  })
  expect(
    await screen.findByRole('rowheader', { name: 'Copper Ore' }),
  ).toBeTruthy()
  expect(screen.queryByText('Loading daily changes…')).toBeNull()
})
