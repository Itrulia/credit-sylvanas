import { plural } from '../plural'
import type { Catalog } from '../types'

// Callers pass counts already formatted with formatInt, so the numbers match the rest of the page.
const itemCount = ({ n, count }: { n: number; count: string }) =>
  plural(n, { one: `${count} item`, other: `${count} items` })

export const items = {
  headTitle: ({ region }: { region: string }) =>
    `Item prices · ${region} Forever AH`,
  headDescription: ({ region }: { region: string }) =>
    `Search and sort every item on the ${region} Forever auction house by market value, sale rate and daily sales.`,
  pageTitle: ({ region }: { region: string }) => `${region} item prices`,

  countLabel: itemCount,
  countMatchingLabel: ({
    n,
    count,
    q,
  }: {
    n: number
    count: string
    q: string
  }) =>
    plural(n, {
      one: `${count} item matching "${q}"`,
      other: `${count} items matching "${q}"`,
    }),

  searchLabel: () => 'Search items',
  searchPlaceholder: () => 'Item name or ID, e.g. Arcanite Bar',

  mostSoldHeading: () => 'Most sold right now',
  pastEndTitle: ({ page }: { page: number }) => `There is no page ${page}.`,
  pastEndBackLink: () => 'Back to page 1',
  pastEndBody: ({
    countText,
    pages,
    pageCount,
  }: {
    countText: string
    pages: number
    pageCount: string
  }) =>
    plural(pages, {
      one: `${countText} fit on ${pageCount} page.`,
      other: `${countText} fit on ${pageCount} pages.`,
    }),
  numericMissTitle: ({ id, region }: { id: string; region: string }) =>
    `No item #${id} in ${region}.`,
  numericMissLink: () => 'Look it up on Wowhead',
  noMatchTitle: ({ q, region }: { q: string; region: string }) =>
    `No items match "${q}" in ${region}.`,
  noMatchHint: () =>
    'Check the spelling, try part of the name ("Arcanite" instead of "Arcanite Bar"), or search by item ID.',

  tableCaption: ({
    region,
    sortLabel,
    order,
  }: {
    region: string
    sortLabel: string
    order: string
  }) => `${region} items by ${sortLabel}, ${order}`,
  tableLabel: ({ region }: { region: string }) => `${region} items`,
  sortName: () => 'item name',
  sortMarketValue: () => 'market value',
  sortVsHist: () => 'market value against the 60-day average',
  sortAvgSalePrice: () => 'average sale price',
  sortSoldPerDay: () => 'units sold per day',
  sortSaleRate: () => 'sale rate',
  sortGoldPerDay: () => 'gold traded per day',
  orderAToZ: () => 'A to Z',
  orderZToA: () => 'Z to A',
  orderLowestFirst: () => 'lowest first',
  orderHighestFirst: () => 'highest first',

  columnItem: () => 'Item',
  columnRealmMarketValue: () => 'Realm market value',
  columnVsHist: () => 'vs 60-day avg',
  columnGoldPerDay: () => 'Gold per day',
  realmNotListed: () => 'Not listed on this realm',
  noListings: () => 'No listings',
  wowheadLinkLabel: ({ name }: { name: string }) =>
    `View ${name} on Wowhead (opens Wowhead)`,

  pagerLabel: () => 'Pages',
  pagerRange: ({
    from,
    to,
    total,
  }: {
    from: string
    to: string
    total: string
  }) => `Showing ${from}–${to} of ${total}`,
  pagerPrevious: () => 'Previous page',
  pagerPrevShort: () => 'Prev',
  pagerNext: () => 'Next page',
  pagerNextShort: () => 'Next',
} satisfies Catalog
