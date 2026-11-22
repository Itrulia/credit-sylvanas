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
  name.trim() || `Item #${id}`
