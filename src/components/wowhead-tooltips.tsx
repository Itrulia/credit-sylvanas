import { useEffect } from 'react'
import { useRouter, useRouterState } from '@tanstack/react-router'
import { WOWHEAD_CONFIG, WOWHEAD_SCRIPT } from '#/lib/wowhead'

declare global {
  interface Window {
    whTooltips?: typeof WOWHEAD_CONFIG
    WH?: { Tooltips?: { refreshLinks?: () => void } }
  }
}

const ICON_TIMEOUT_MS = 10_000

/**
 * styles.css reserves the icon box on item links from first paint;
 * data-wowhead="off" on <html> drops those boxes where tooltips.js won't run.
 */
export function setIconsOff(off: boolean) {
  if (off) {
    document.documentElement.dataset.wowhead = 'off'
  } else {
    delete document.documentElement.dataset.wowhead
  }
}

export function loadWowheadScript(timeoutMs = ICON_TIMEOUT_MS) {
  window.whTooltips = WOWHEAD_CONFIG
  const script = document.createElement('script')
  script.src = WOWHEAD_SCRIPT
  script.async = true
  // a blocked or failed load only means no icons, so drop the reserved boxes
  script.onerror = () => setIconsOff(true)
  document.head.appendChild(script)
  setTimeout(() => {
    if (!window.WH) {
      setIconsOff(true)
    }
  }, timeoutMs)
}

const NO_SCRIPT = new Set(['/', '/about', '/impressum', '/privacy'])

/**
 * Client-only progressive enhancement: loads Wowhead's tooltip script once
 * (never on pages without item links) and re-scans links after each client navigation.
 */
export function WowheadTooltips() {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const wanted = !NO_SCRIPT.has(pathname)

  useEffect(() => {
    // once inserted, the script's onerror and timeout own the off state
    if (document.querySelector(`script[src="${WOWHEAD_SCRIPT}"]`)) {
      return
    }
    setIconsOff(!wanted)
    if (wanted) {
      loadWowheadScript()
    }
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
