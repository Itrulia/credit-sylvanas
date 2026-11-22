// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import type { RegionStatus } from '#/server/types'
import { NoData } from './no-data'

afterEach(cleanup)

const status = (regionsWithData: RegionStatus['regionsWithData']) => ({
  fetchedAt: null,
  regionsWithData,
})

async function show(s: ReturnType<typeof status>) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <NoData region="eu" status={s} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  render(<RouterProvider router={router} />)
  return screen.findByRole('heading', { level: 1 })
}

it('sends people to the regions that have prices', async () => {
  expect((await show(status(['us']))).textContent).toBe('No EU prices yet')
  expect(screen.getByRole('link', { name: 'US' })).toBeTruthy()
})

it('says no prices anywhere when no region has data', async () => {
  expect((await show(status([]))).textContent).toBe('No prices yet')
  expect(
    screen.getByText(/hasn't finished its first daily price update/),
  ).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'US' })).toBeNull()
})
