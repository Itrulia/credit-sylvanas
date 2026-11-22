import { useSyncExternalStore } from 'react'
import { z } from 'zod'
import { Region } from '#/lib/search'

// Per-viewer conveniences kept only in this browser's local storage: the
// palette lists recently viewed and favourite items without a request.
export const SavedItem = z.object({
  region: Region,
  itemId: z.number().int().positive(),
  name: z.string().max(200),
})
export type SavedItem = z.infer<typeof SavedItem>

const EMPTY: SavedItem[] = []
const same = (a: SavedItem, b: SavedItem) =>
  a.region === b.region && a.itemId === b.itemId

function parse(raw: string | null, cap: number): SavedItem[] {
  let data: unknown
  try {
    data = raw === null ? [] : JSON.parse(raw)
  } catch {
    return EMPTY
  }
  if (!Array.isArray(data)) {
    return EMPTY
  }
  const items: SavedItem[] = []
  for (const entry of data) {
    const parsed = SavedItem.safeParse(entry)
    if (parsed.success && !items.some((item) => same(item, parsed.data))) {
      items.push(parsed.data)
    }
  }
  return items.slice(0, cap)
}

function listStore(key: string, cap: number) {
  const listeners = new Set<() => void>()
  // undefined forces a re-parse; the cache keeps the snapshot stable
  let raw: string | null | undefined
  let cached = EMPTY
  // set once a write fails: getItem may still answer with the old value
  let memoryOnly = false
  const notify = () => listeners.forEach((listener) => listener())
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) {
      notify()
    }
  }

  return {
    read(): SavedItem[] {
      if (memoryOnly) {
        return cached
      }
      let next: string | null
      try {
        next = localStorage.getItem(key)
      } catch {
        return cached
      }
      if (next !== raw) {
        raw = next
        cached = parse(next, cap)
      }
      return cached
    },
    write(items: SavedItem[]) {
      cached = items.slice(0, cap)
      if (!memoryOnly) {
        try {
          raw = JSON.stringify(cached)
          localStorage.setItem(key, raw)
        } catch {
          // full or blocked storage: keep the list for this page session
          memoryOnly = true
        }
      }
      notify()
    },
    subscribe(listener: () => void) {
      if (!listeners.size) {
        window.addEventListener('storage', onStorage)
      }
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        if (!listeners.size) {
          window.removeEventListener('storage', onStorage)
        }
      }
    },
  }
}

export type SavedItemStore = ReturnType<typeof listStore>

export const recentItems = listStore('recent-items', 3)
export const favouriteItems = listStore('favourite-items', 500)

export const isFavourite = (items: SavedItem[], item: SavedItem) =>
  items.some((saved) => same(saved, item))

export function rememberRecent(item: SavedItem) {
  const current = recentItems.read()
  if (current[0] && same(current[0], item) && current[0].name === item.name) {
    return
  }
  recentItems.write([item, ...current.filter((saved) => !same(saved, item))])
}

export function toggleFavourite(item: SavedItem) {
  const current = favouriteItems.read()
  favouriteItems.write(
    isFavourite(current, item)
      ? current.filter((saved) => !same(saved, item))
      : [item, ...current],
  )
}

/** Empty on the server and during hydration, then the stored list. */
export function useSavedItems(store: SavedItemStore): SavedItem[] {
  return useSyncExternalStore(store.subscribe, store.read, () => EMPTY)
}
