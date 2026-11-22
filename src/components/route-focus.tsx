import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'

/**
 * After a client navigation to a new path, focus the page's h1 (or main) so
 * keyboard and screen reader users land on, and hear, the new page instead of
 * <body>. The first load and search-only changes (sort, page, q) keep focus.
 */
export function focusNewPage(e: {
  fromLocation?: unknown
  pathChanged: boolean
}) {
  if (!e.fromLocation || !e.pathChanged) {
    return
  }
  const main = document.getElementById('main')
  const target = main?.querySelector<HTMLElement>('h1') ?? main
  if (!target) {
    return
  }
  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1')
  }
  target.focus({ preventScroll: true })
}

export function RouteFocus() {
  const router = useRouter()
  // subscribing to the router, an external system, is what effects are for
  useEffect(() => router.subscribe('onRendered', focusNewPage), [router])
  return null
}
