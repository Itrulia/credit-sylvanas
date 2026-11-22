import { plural } from '../plural'
import type { Catalog } from '../types'

export const palette = {
  triggerLabel: () => 'Search or jump to…',
  dialogTitle: () => 'Search or jump to',
  inputLabel: () => 'Search items or jump to a page',
  inputPlaceholder: () => 'Item name or ID, e.g. Arcanite Bar',
  resultsLabel: () => 'Results',
  resultCount: ({ n }: { n: number }) =>
    plural(n, { one: `${n} result`, other: `${n} results` }),
  noResultsStatus: ({ query }: { query: string }) => `No results for ${query}`,
  // the query follows in <strong>
  noResultsLead: () => 'No results for ',
  hintMove: () => 'to move',
  hintOpen: () => 'to open',
  hintClose: () => 'to close',
  keyEnter: () => 'Enter',
  keyEsc: () => 'Esc',

  groupNavigate: () => 'Navigate',
  groupRegion: () => 'Region',
  groupRealm: () => 'Realm',
  groupRecent: () => 'Recent',
  groupFavourites: () => 'Favourites',
  groupItems: ({ region }: { region: string }) => `Items in ${region}`,

  navMarket: () => 'Market',
  navItems: () => 'Items',
  navHeatmaps: () => 'Heatmaps',
  navRealms: () => 'Realms',
  navAbout: () => 'About',
  switchRegion: ({ region }: { region: string }) => `Switch to ${region}`,
  realmAll: () => 'All realms (region)',
  realmFaction: ({ realm, faction }: { realm: string; faction: string }) =>
    `${realm} (${faction})`,

  itemSearchFailed: () => 'Item search failed',
  itemSearching: () => 'Searching…',
  itemNoMatch: ({ q, region }: { q: string; region: string }) =>
    `No item matches "${q}" in ${region}.`,
  itemSearchAll: () => 'Search all items',
  // callers pass the count already formatted with formatNumber
  itemSoldPerDay: ({ n }: { n: string }) => `${n} sold/day`,
} satisfies Catalog
