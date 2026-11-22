import { useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { REGION_INFO } from '#/config/regions'
import {
  favouriteItems,
  isFavourite,
  recentItems,
  useSavedItems,
} from '#/lib/saved-items'
import type { SavedItem } from '#/lib/saved-items'
import { itemName } from '#/lib/wowhead'
import { m } from '#/paraglide/messages.js'
import type { Command, DynamicGroup } from '../command-palette/command'
import { searchCommands } from '../command-palette/search-commands'
import { Icon } from '../icon'
import type { IconName } from '#/lib/icons'

type Navigate = ReturnType<typeof useNavigate>

export function savedItemCommand(
  item: SavedItem,
  group: string,
  icon: IconName,
  navigate: Navigate,
): Command {
  return {
    id: `${group}-${item.region}-${item.itemId}`,
    group,
    title: itemName(item.name, item.itemId),
    keywords: [String(item.itemId)],
    section: REGION_INFO[item.region].name,
    icon: <Icon name={icon} />,
    perform: () =>
      void navigate({
        to: '/$region/items/$itemId',
        params: { region: item.region, itemId: String(item.itemId) },
      }),
  }
}

const FAVOURITES_WHILE_EMPTY = 5

/**
 * Recent and a few favourites while the query is empty; once the visitor
 * types, every favourite that fuzzy-matches. The item page you are on is
 * never listed as Recent.
 */
export function useSavedItemGroups(query: string): DynamicGroup[] {
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const recent = useSavedItems(recentItems)
  const favourites = useSavedItems(favouriteItems)
  const favouriteCommands = useMemo(
    () =>
      favourites.map((item) =>
        savedItemCommand(item, m.palette_groupFavourites(), 'star', navigate),
      ),
    [favourites, navigate],
  )
  if (query.trim()) {
    const commands = searchCommands(favouriteCommands, query).map(
      (match) => match.command,
    )
    return [{ id: 'favourites', label: m.palette_groupFavourites(), commands }]
  }
  const shownRecent = recent.filter(
    (item) =>
      item.region !== params.region || String(item.itemId) !== params.itemId,
  )
  const shownFavourites = favouriteCommands
    .filter((_, i) => !isFavourite(recent, favourites[i]))
    .slice(0, FAVOURITES_WHILE_EMPTY)
  return [
    {
      id: 'recent',
      label: m.palette_groupRecent(),
      commands: shownRecent.map((item) =>
        savedItemCommand(item, m.palette_groupRecent(), 'history', navigate),
      ),
    },
    {
      id: 'favourites',
      label: m.palette_groupFavourites(),
      commands: shownFavourites,
    },
  ]
}
