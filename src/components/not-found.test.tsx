// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  notFound,
} from '@tanstack/react-router'
import { CommandPaletteProvider } from './command-palette/command-palette-provider'
import { ErrorPage } from './error-page'
import { NotFound } from './not-found'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function setup(url: string, data?: unknown) {
  const root = createRootRoute({
    component: () => (
      <CommandPaletteProvider commands={[]}>
        <Outlet />
      </CommandPaletteProvider>
    ),
  })
  const region = createRoute({
    getParentRoute: () => root,
    path: '$region',
    beforeLoad: () => {
      if (data) {
        throw notFound({ data })
      }
    },
  })
  const router = createRouter({
    routeTree: root.addChildren([region]),
    history: createMemoryHistory({ initialEntries: [url] }),
    defaultNotFoundComponent: NotFound,
  })
  render(<RouterProvider router={router} />)
  return router
}

it('names the missing region and lists the real ones', async () => {
  setup('/xx', { kind: 'region', value: 'xx' })
  expect(
    await screen.findByRole('heading', {
      level: 1,
      name: 'There\'s no "xx" region.',
    }),
  ).toBeTruthy()
  expect(screen.getByText(/exist in US, EU, KR and TW/)).toBeTruthy()
  expect(screen.getByRole('link', { name: /^EU/ }).getAttribute('href')).toBe(
    '/eu',
  )
})

it('names an unknown realm and links to the region prices', async () => {
  setup('/eu?realm=nope', { kind: 'realm', value: 'nope' })
  expect(
    await screen.findByRole('heading', {
      level: 1,
      name: 'We don\'t track "nope" yet.',
    }),
  ).toBeTruthy()
  expect(
    screen
      .getByRole('link', { name: 'See EU region prices' })
      .getAttribute('href'),
  ).toBe('/eu')
})

it('offers search and the market for an unknown path', async () => {
  setup('/us/nowhere/at/all')
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Page not found.' }),
  ).toBeTruthy()
  expect(screen.getByText(/Try searching for an item instead/)).toBeTruthy()
  expect(
    screen.getByRole('button', { name: /search or jump to/i }),
  ).toBeTruthy()
  expect(
    screen.getByRole('link', { name: 'Go to US market' }).getAttribute('href'),
  ).toBe('/us')
})

it('marks 404s noindex', async () => {
  setup('/xx', { kind: 'region', value: 'xx' })
  await screen.findByRole('heading', { level: 1 })
  expect(
    document.querySelector('meta[name="robots"]')?.getAttribute('content'),
  ).toBe('noindex')
})

it('shows the 500 page with a retry and logs the error', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const error = new Error('D1 unreachable')
  const root = createRootRoute({
    component: () => <ErrorPage error={error} reset={() => undefined} />,
  })
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const invalidate = vi.spyOn(router, 'invalidate').mockResolvedValue()
  render(<RouterProvider router={router} />)
  expect(
    await screen.findByRole('heading', {
      level: 1,
      name: 'Something broke on our side.',
    }),
  ).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(invalidate).toHaveBeenCalled()
  expect(log).toHaveBeenCalledWith(error)
})
