import { Region } from '#/lib/search'

// Per-viewer convenience only: pages without a region (/, /about, a 404)
// default the nav and palette to the region the viewer last opened.
const KEY = 'last-region'
const listeners = new Set<() => void>()

export function readLastRegion(): Region | null {
  try {
    const parsed = Region.safeParse(localStorage.getItem(KEY))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function rememberRegion(region: Region) {
  try {
    if (localStorage.getItem(KEY) === region) {
      return
    }
    localStorage.setItem(KEY, region)
  } catch {
    return
  }
  listeners.forEach((listener) => listener())
}

export function subscribeLastRegion(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
