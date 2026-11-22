import { useEffect } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { WOWHEAD_CONFIG, WOWHEAD_SCRIPT } from '#/lib/wowhead'

declare global {
  interface Window {
    whTooltips?: typeof WOWHEAD_CONFIG
    WH?: { Tooltips?: { refreshLinks?: () => void } }
  }
}

const NO_SCRIPT = new Set(['/', '/about'])

/**
 * Client-only progressive enhancement: loads Wowhead's tooltip script once
 * (never on / or /about) and re-scans links after each client navigation.
 */
export function WowheadTooltips() {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const wanted = !NO_SCRIPT.has(pathname)

  useEffect(() => {
    if (!wanted || document.querySelector(`script[src="${WOWHEAD_SCRIPT}"]`)) {
      return
    }
    window.whTooltips = WOWHEAD_CONFIG
    const script = document.createElement('script')
    script.src = WOWHEAD_SCRIPT
    script.async = true
    // a blocked or failed load only means no icons
    script.onerror = () => undefined
    document.head.appendChild(script)
  }, [wanted])

  useEffect(
    // refreshLinks is undocumented, so every step is guarded
    () =>
      router.subscribe('onResolved', () =>
        window.WH?.Tooltips?.refreshLinks?.(),
      ),
    [router],
  )

  return null
}
