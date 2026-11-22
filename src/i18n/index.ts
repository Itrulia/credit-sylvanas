// Isomorphic: safe from head(), SSR components and src/lib. Never import src/server here.
import { format } from './en/format'
import { heatmap } from './en/heatmap'
import { home } from './en/home'
import { item } from './en/item'
import { items } from './en/items'
import { legal } from './en/legal'
import { market } from './en/market'
import { palette } from './en/palette'
import { realms } from './en/realms'
import { shell } from './en/shell'

/** Paraglide-shaped: `m.market.hottestTitle()`, `m.items.count({ n })`. */
export const m = {
  shell,
  legal,
  home,
  market,
  items,
  item,
  heatmap,
  palette,
  realms,
  format,
}

export type Messages = typeof m
export type Area = keyof Messages
export type { Catalog, Message } from './types'
export { LOCALE } from './locale'
export type { Locale } from './locale'
export { plural } from './plural'
