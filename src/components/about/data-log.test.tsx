// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
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
import type { ImportLogRow } from '#/server/types'
import { DataLog } from './data-log'

const load = vi.fn<() => Promise<ImportLogRow[]>>()

vi.mock('#/server/fns/imports', () => ({
  importLogQuery: (input: { limit?: number } = {}) =>
    queryOptions({ queryKey: ['getImportLog', input], queryFn: () => load() }),
}))

const ROWS: ImportLogRow[] = [
  {
    fetchedAt: 1_795_375_860, // 22 Nov 2026, 19:31 UTC
    updatedAt: 1_795_320_600, // 22 Nov 2026, 04:10 UTC
    region: 'us',
    kind: 'region',
    realm: null,
    rows: 14_211,
    status: 'imported',
    reason: null,
    sha: '3f9a0c1d2e4b',
  },
  {
    fetchedAt: 1_795_375_800,
    updatedAt: null,
    region: 'eu',
    kind: 'realm',
    realm: 'stormrage',
    rows: 0,
    status: 'failed',
    reason: 'HTTP 404',
    sha: null,
  },
]

function setup() {
  const root = createRootRoute({ component: DataLog })
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  load.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('shows a busy skeleton while loading', async () => {
  load.mockReturnValue(new Promise(() => undefined))
  setup()
  const busy = await screen.findByText('Loading the data log…')
  expect(busy.closest('[aria-busy="true"]')).toBeTruthy()
  expect(screen.queryByRole('table')).toBeNull()
})

it('lists imports with times, status word and short hash, no links', async () => {
  load.mockResolvedValue(ROWS)
  setup()
  const table = await screen.findByRole('table', {
    name: 'Recent price imports',
  })
  const [, first, second] = within(table).getAllByRole('row')
  expect(first.textContent).toContain('22 Nov 2026, 19:31 UTC')
  expect(first.textContent).toContain('22 Nov 2026, 04:10 UTC')
  expect(first.textContent).toContain('US')
  expect(first.textContent).toContain('14,211')
  expect(first.textContent).toContain('Imported')
  expect(first.textContent).toContain('3f9a0c1d2e4b')
  expect(second.textContent).toContain('EU · stormrage')
  expect(second.textContent).toContain('Failed')
  expect(second.textContent).toContain('HTTP 404')
  expect(within(table).queryAllByRole('link')).toHaveLength(0)
  expect(table.querySelector('time')?.getAttribute('datetime')).toBe(
    '2026-11-22T19:31:00.000Z',
  )
})

it('has its own empty state', async () => {
  load.mockResolvedValue([])
  setup()
  expect(await screen.findByText('No imports yet.')).toBeTruthy()
  expect(
    screen.getByText("The first daily price update hasn't run."),
  ).toBeTruthy()
})

it('shows the section failed state when the call rejects', async () => {
  load.mockRejectedValue(new Error('D1 down'))
  setup()
  expect(await screen.findByText("These prices didn't load.")).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy()
})
