import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  stripSearchParams,
} from '@tanstack/react-router'
import { ITEMS_DEFAULTS, contextSearch, itemsSearch } from '#/lib/search'

/** Renders `ui` on a memory router shaped like /$region/items, so Links resolve. */
export function renderAtItems(ui: ReactNode, url = '/us/items') {
  const root = createRootRoute({ component: Outlet })
  const region = createRoute({
    getParentRoute: () => root,
    path: '$region',
    validateSearch: contextSearch,
    component: Outlet,
  })
  const items = createRoute({
    getParentRoute: () => region,
    path: 'items/',
    validateSearch: itemsSearch,
    search: { middlewares: [stripSearchParams(ITEMS_DEFAULTS)] },
    component: () => ui,
  })
  const detail = createRoute({
    getParentRoute: () => region,
    path: 'items/$itemId',
    component: () => null,
  })
  const router = createRouter({
    routeTree: root.addChildren([region.addChildren([items, detail])]),
    history: createMemoryHistory({ initialEntries: [url] }),
  })
  return { router, ...render(<RouterProvider router={router} />) }
}
