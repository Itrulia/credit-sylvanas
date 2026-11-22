import { useEffect } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { REGION_INFO } from '#/config/regions'
import { formatNumber } from '#/lib/format'
import { itemName } from '#/lib/wowhead'
import { searchItemsQuery } from '#/server/fns/items'
import type { DynamicGroup } from '../command-palette/command'
import { Icon } from '../icon'
import { ItemLink } from '../item-link'
import { Money } from '../money'
import { useRegion } from './site-commands'

const MIN_CHARS = 2
const DEBOUNCE_MS = 200

/**
 * Live Items group for the palette. Must stay a module-level function: the
 * provider calls it as a hook on every render.
 */
export function useItemSearchGroups(query: string): DynamicGroup[] {
  const navigate = useNavigate()
  const region = useRegion()
  // the region is in the label: on / and /about it is not in the URL
  const GROUP = { id: 'items', label: `Items in ${REGION_INFO[region].name}` }
  // SearchInput caps q at 64; a longer query would fail validation
  const q = query.trim().slice(0, 64).trim()
  const [settled] = useDebouncedValue(q, { wait: DEBOUNCE_MS })
  const { data, isError, isPlaceholderData } = useQuery({
    ...searchItemsQuery({ region, q: settled }),
    enabled: settled.length >= MIN_CHARS,
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    // Wowhead only scans links on navigation; palette rows appear without one
    if (data?.length) {
      window.WH?.Tooltips?.refreshLinks?.()
    }
  }, [data])

  if (q.length < MIN_CHARS) {
    return []
  }
  if (isError) {
    return [{ ...GROUP, commands: [], status: 'Item search failed' }]
  }
  if (
    !data ||
    (isPlaceholderData && !data.length) ||
    (settled !== q && !data.length)
  ) {
    return [{ ...GROUP, commands: [], status: 'Searching…' }]
  }
  if (!data.length) {
    return [
      {
        ...GROUP,
        status: `No item matches "${q}" in ${REGION_INFO[region].name}.`,
        commands: [
          {
            id: 'items-search-all',
            group: GROUP.label,
            title: 'Search all items',
            icon: <Icon name="search" />,
            perform: () =>
              void navigate({
                to: '/$region/items',
                params: { region },
                search: { q },
              }),
          },
        ],
      },
    ]
  }
  return [
    {
      ...GROUP,
      commands: data.map((row) => ({
        id: `item-${row.id}`,
        group: GROUP.label,
        title: itemName(row.name, row.id),
        content: (
          <span className="flex min-w-0 items-center justify-between gap-3">
            <ItemLink
              id={row.id}
              name={row.name}
              region={region}
              className="min-w-0"
            />
            <span className="flex shrink-0 items-center gap-3 text-xs font-normal text-muted-foreground">
              <Money
                copper={row.mv}
                variant="compact"
                className="text-foreground"
              />
              {row.spd !== null && (
                <span>{formatNumber(row.spd, 1)} sold/day</span>
              )}
            </span>
          </span>
        ),
        perform: () =>
          void navigate({
            to: '/$region/items/$itemId',
            params: { region, itemId: String(row.id) },
          }),
      })),
    },
  ]
}
