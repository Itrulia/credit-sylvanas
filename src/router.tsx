import { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { ErrorPage } from '#/components/error-page'
import { NotFound } from '#/components/not-found'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  // one client per call, so per SSR request: no data leaks between visitors
  const queryClient = new QueryClient({
    defaultOptions: {
      // data changes at most every few hours
      queries: { staleTime: 60 * 60_000, refetchOnWindowFocus: false },
    },
  })
  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: ErrorPage,
  })
  setupRouterSsrQueryIntegration({ router, queryClient })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
