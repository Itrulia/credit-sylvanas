// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
} from '@tanstack/react-query'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  retainSearchParams,
  stripSearchParams,
} from '@tanstack/react-router'
import { HotkeyManager } from '@tanstack/react-hotkeys'
import { CommandPaletteTrigger } from '#/components/command-palette/command-palette-trigger'
import {
  ITEMS_DEFAULTS,
  ITEM_DEFAULTS,
  contextSearch,
  itemSearch,
  itemsSearch,
} from '#/lib/search'
import type { SearchRow } from '#/server/types'
import { SitePalette } from './site-palette'

const search =
  vi.fn<(input: { region: string; q: string }) => Promise<SearchRow[]>>()

vi.mock('#/server/fns/items', () => ({
  searchItemsQuery: (input: { region: string; q: string }) =>
    queryOptions({
      queryKey: ['searchItems', input],
      queryFn: () => search(input),
    }),
}))

const ARCANITE: SearchRow = {
  id: 12360,
  name: 'Arcanite Bar',
  mv: 1_234_567,
  spd: 12.5,
}

function setup(url: string) {
  const root = createRootRoute({
    component: () => (
      <SitePalette>
        <CommandPaletteTrigger />
        <Outlet />
      </SitePalette>
    ),
  })
  const page = (path: string) =>
    createRoute({ getParentRoute: () => root, path, component: () => null })
  const region = createRoute({
    getParentRoute: () => root,
    path: '$region',
    validateSearch: contextSearch,
    search: { middlewares: [retainSearchParams(['realm', 'faction'])] },
    component: Outlet,
  })
  const child = (path: string) =>
    createRoute({ getParentRoute: () => region, path, component: () => null })
  // same search handling as the real routes
  const items = createRoute({
    getParentRoute: () => region,
    path: 'items',
    validateSearch: itemsSearch,
    search: { middlewares: [stripSearchParams(ITEMS_DEFAULTS)] },
    component: () => null,
  })
  const item = createRoute({
    getParentRoute: () => region,
    path: 'items/$itemId',
    validateSearch: itemSearch,
    search: { middlewares: [stripSearchParams(ITEM_DEFAULTS)] },
    component: () => null,
  })
  const router = createRouter({
    routeTree: root.addChildren([
      page('/'),
      page('about'),
      region.addChildren([
        child('/'),
        items,
        item,
        child('heatmap'),
        child('realms'),
      ]),
    ]),
    history: createMemoryHistory({ initialEntries: [url] }),
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

const location = (router: ReturnType<typeof setup>) =>
  router.state.location.pathname + router.state.location.searchStr

async function openPalette() {
  fireEvent.click(
    await screen.findByRole('button', { name: /search or jump to/i }),
  )
  return screen.findByRole('combobox')
}
const type = (value: string) =>
  fireEvent.change(screen.getByRole('combobox'), { target: { value } })
const press = (key: string) =>
  fireEvent.keyDown(screen.getByRole('combobox'), { key })
const selected = () =>
  screen
    .getAllByRole('option')
    .find((row) => row.getAttribute('aria-selected') === 'true')?.textContent

beforeEach(() => {
  HotkeyManager.resetInstance()
  search.mockReset()
})

afterEach(() => {
  cleanup()
  HotkeyManager.resetInstance()
})

describe('site commands', () => {
  it('lists Navigate and Region groups, without Realm while realms.ts is empty', async () => {
    setup('/us')
    await openPalette()
    const groups = screen
      .getAllByRole('group')
      .map(
        (g) =>
          document.getElementById(g.getAttribute('aria-labelledby')!)
            ?.textContent,
      )
    expect(groups).toEqual(['Navigate', 'Region'])
    expect(screen.queryByRole('option', { name: /^realms$/i })).toBeNull()
    expect(screen.getByRole('option', { name: 'About' })).toBeTruthy()
  })

  it('navigates to a page in the current region', async () => {
    const router = setup('/eu')
    await openPalette()
    type('heatmaps')
    press('Enter')
    await waitFor(() => expect(location(router)).toBe('/eu/heatmap'))
  })

  it('switches region keeping the page and its search, dropping realm and faction', async () => {
    const router = setup('/us/items?q=bar&realm=x&faction=horde')
    await openPalette()
    type('switch to eu')
    press('Enter')
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/eu/items'),
    )
    expect(router.state.location.search).toEqual(
      expect.objectContaining({ q: 'bar' }),
    )
    expect(router.state.location.searchStr).not.toMatch(/realm|faction/)
  })

  it('keeps the item when switching region on item detail', async () => {
    const router = setup('/us/items/12360?mvRange=7d')
    await openPalette()
    type('switch to eu')
    press('Enter')
    await waitFor(() =>
      expect(location(router)).toBe('/eu/items/12360?mvRange=7d'),
    )
  })

  it('goes to the region market from the landing page', async () => {
    const router = setup('/')
    await openPalette()
    type('switch to eu')
    press('Enter')
    await waitFor(() => expect(location(router)).toBe('/eu'))
  })

  it('returns focus to the trigger on Escape', async () => {
    setup('/us')
    const trigger = await screen.findByRole('button', {
      name: /search or jump to/i,
    })
    trigger.focus()
    fireEvent.click(trigger)
    const input = await screen.findByRole('combobox')
    fireEvent.keyDown(input, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    // Radix restores focus on a timeout after unmount
    await waitFor(() => expect(document.activeElement).toBe(trigger))
  })
})

describe('item search group', () => {
  it('sends one request per settled query and navigates to the item on Enter', async () => {
    search.mockResolvedValue([ARCANITE])
    const router = setup('/eu')
    await openPalette()
    type('a')
    type('ar')
    type('arc')
    expect(
      await screen.findByRole('option', { name: /arcanite bar/i }),
    ).toBeTruthy()
    expect(search).toHaveBeenCalledTimes(1)
    expect(search).toHaveBeenCalledWith({ region: 'eu', q: 'arc' })
    press('End')
    expect(selected()).toMatch(/Arcanite Bar/)
    press('Enter')
    await waitFor(() => expect(location(router)).toBe('/eu/items/12360'))
  })

  it('shows price and sold per day on each row', async () => {
    search.mockResolvedValue([ARCANITE])
    setup('/us')
    await openPalette()
    type('arcanite')
    const row = await screen.findByRole('option', { name: /arcanite bar/i })
    expect(row.textContent).toContain('12.5 sold/day')
    expect(row.querySelector('data')?.getAttribute('value')).toBe('1234567')
  })

  it('does not search below two characters and defaults to US off a region', async () => {
    search.mockResolvedValue([])
    setup('/')
    await openPalette()
    type('a')
    await act(() => new Promise((r) => setTimeout(r, 300)))
    expect(search).not.toHaveBeenCalled()
    type('ab')
    await screen.findByText(/No item matches "ab" in US/)
    expect(search).toHaveBeenCalledWith({ region: 'us', q: 'ab' })
  })

  it('caps the query at the 64 characters the server fn accepts', async () => {
    search.mockResolvedValue([])
    setup('/us')
    await openPalette()
    type('a'.repeat(80))
    await waitFor(() =>
      expect(search).toHaveBeenCalledWith({ region: 'us', q: 'a'.repeat(64) }),
    )
  })

  it('shows Searching while pending', async () => {
    search.mockReturnValue(new Promise(() => undefined))
    setup('/us')
    await openPalette()
    type('arc')
    expect(await screen.findByText('Searching…')).toBeTruthy()
  })

  it('offers the items page when nothing matches', async () => {
    search.mockResolvedValue([])
    const router = setup('/us')
    await openPalette()
    type('zzzz')
    await screen.findByText(/No item matches "zzzz" in US/)
    press('End')
    expect(selected()).toMatch(/Search all items/)
    press('Enter')
    await waitFor(() => expect(location(router)).toBe('/us/items?q=zzzz'))
  })

  it('reports a failed search inside the group only', async () => {
    search.mockRejectedValue(new Error('boom'))
    setup('/us')
    await openPalette()
    type('arc')
    expect(await screen.findByText('Item search failed')).toBeTruthy()
    expect(screen.getByRole('combobox')).toBeTruthy()
  })
})
