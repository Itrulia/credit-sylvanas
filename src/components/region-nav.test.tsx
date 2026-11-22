// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  retainSearchParams,
} from '@tanstack/react-router'
import { contextSearch, itemsSearch } from '#/lib/search'
import { RegionNav } from './region-nav'

afterEach(cleanup)

it('switches region keeping the page and q, dropping realm and faction', async () => {
  const root = createRootRoute({ component: Outlet })
  const region = createRoute({
    getParentRoute: () => root,
    path: '$region',
    validateSearch: contextSearch,
    search: { middlewares: [retainSearchParams(['realm', 'faction'])] },
    component: () => <Outlet />,
  })
  const items = createRoute({
    getParentRoute: () => region,
    path: 'items',
    validateSearch: itemsSearch,
    component: function Items() {
      const { region: current } = items.useParams()
      return <RegionNav current={current} />
    },
  })
  const router = createRouter({
    routeTree: root.addChildren([region.addChildren([items])]),
    history: createMemoryHistory({
      initialEntries: ['/us/items?q=bar&realm=x&faction=horde'],
    }),
  })
  render(<RouterProvider router={router} />)
  const eu = await screen.findByRole('link', { name: 'EU' })
  const href = eu.getAttribute('href')!
  expect(href.startsWith('/eu/items')).toBe(true)
  expect(href).toContain('q=bar')
  expect(href).not.toContain('realm=')
  expect(href).not.toContain('faction=')
  expect(
    screen.getByRole('link', { name: 'US' }).getAttribute('aria-current'),
  ).toBe('page')
})
