import { m } from '#/paraglide/messages.js'

// Wowhead Forever links. The domain param picks the game version (wowhead.com/tooltips, read 2026-11-22).
export const wowheadItemUrl = (id: number) =>
  `https://www.wowhead.com/forever/item=${id}`
export const wowheadData = (id: number) => `item=${id}&domain=forever`
export const WOWHEAD_SCRIPT = 'https://wow.zamimg.com/js/tooltips.js'
export const WOWHEAD_CONFIG = {
  colorLinks: false,
  iconizeLinks: true,
  renameLinks: false,
  iconSize: 'small',
} as const

/** Names can be empty in TSM files; never render a blank link. */
export const itemName = (name: string, id: number) =>
  name.trim() || m.format_itemFallback({ id })

const stopPropagation = (e: Event) => e.stopPropagation()

/**
 * Callback ref for the name inside an item link. Wowhead opens tooltips from
 * one mouseover listener on document, so stopping the event here limits the
 * tooltip to the icon it inserts next to the name.
 */
export function iconOnlyTooltip(el: HTMLElement | null) {
  if (!el) {
    return
  }
  el.addEventListener('mouseover', stopPropagation)
  return () => el.removeEventListener('mouseover', stopPropagation)
}

let rescanQueued = false

/**
 * Callback ref that adds `data-wowhead` once React has mounted the link.
 * Server HTML leaves it out: the script would otherwise put its icon into a
 * streamed section React has not hydrated yet, which fails hydration
 * (minified React error #418). Tagged links get one rescan per frame.
 */
export const tagForWowhead = (id: number) => (el: HTMLElement | null) => {
  if (!el) {
    return
  }
  el.dataset.wowhead = wowheadData(id)
  if (rescanQueued) {
    return
  }
  rescanQueued = true
  requestAnimationFrame(() => {
    rescanQueued = false
    // refreshLinks is undocumented, so every step is guarded
    window.WH?.Tooltips?.refreshLinks?.()
  })
}
