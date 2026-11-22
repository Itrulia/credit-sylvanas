import type { AnalyticsProvider } from './index'

interface Umami {
  track: (event?: string, props?: Record<string, string | number>) => void
}

declare global {
  interface Window {
    umami?: Umami
  }
}

export const UMAMI_SCRIPT = 'https://cloud.umami.is/script.js'

/**
 * Umami Cloud (EU), cookieless. Pageviews are manual (auto-track off) so the
 * router decides what counts, and the query string is never sent because it
 * can hold a search term. The script loads on the first call.
 */
export function umamiProvider({
  websiteId,
  domain,
}: {
  websiteId: string
  domain: string
}): AnalyticsProvider {
  let queue: Array<(umami: Umami) => void> | null = null
  let blocked = false

  const load = () => {
    const script = document.createElement('script')
    script.src = UMAMI_SCRIPT
    script.defer = true
    Object.assign(script.dataset, {
      websiteId,
      domains: domain,
      doNotTrack: 'true',
      autoTrack: 'false',
      excludeSearch: 'true',
      excludeHash: 'true',
    })
    script.onload = () => {
      const pending = queue ?? []
      queue = null
      const umami = window.umami
      if (umami) {
        pending.forEach((call) => call(umami))
      }
    }
    // an ad blocker only means no stats
    script.onerror = () => {
      blocked = true
      queue = null
    }
    document.head.appendChild(script)
  }

  const run = (call: (umami: Umami) => void) => {
    if (typeof window === 'undefined' || blocked) {
      return
    }
    if (window.umami) {
      call(window.umami)
      return
    }
    if (!queue) {
      queue = []
      load()
    }
    queue.push(call)
  }

  return {
    track: (event, props) => run((umami) => umami.track(event, props)),
    pageview: () => run((umami) => umami.track()),
  }
}
