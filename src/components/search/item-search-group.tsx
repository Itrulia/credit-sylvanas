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
import { useCurrentRegion } from './site-commands'

const MIN_CHARS = 2
const DEBOUNCE_MS = 200
const GROUP = { id: 'items', label: 'Items' }

/**
 * Live Items group for the palette. Must stay a module-level function: the
 * provider calls it as a hook on every render.
 */
export function useItemSearchGroups(query: string): DynamicGroup[] {
  const navigate = useNavigate()
  const region = useCurrentRegion() ?? 'us'
  const q = query.trim()
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
              className="truncate"
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
