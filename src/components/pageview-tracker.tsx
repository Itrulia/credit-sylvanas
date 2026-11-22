import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { trackPageview } from '#/lib/analytics'

/**
 * One pageview per path, on first load and after each client navigation.
 * Search-param changes (ranges, sorting, paging) are not new pages.
 */
export function PageviewTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  useEffect(() => trackPageview(), [pathname])
  return null
}
