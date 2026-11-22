import { useNavigate } from '@tanstack/react-router'
import { REGION_INFO } from '#/config/regions'
import { recentItems, useSavedItems } from '#/lib/saved-items'
import type { SavedItem } from '#/lib/saved-items'
import { itemName } from '#/lib/wowhead'
import type { Command, DynamicGroup } from '../command-palette/command'
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

/** Recently viewed items, only while the query is empty. */
export function useRecentGroups(query: string): DynamicGroup[] {
  const navigate = useNavigate()
  const recent = useSavedItems(recentItems)
  if (query.trim() || !recent.length) {
    return []
  }
  return [
    {
      id: 'recent',
      label: 'Recent',
      commands: recent.map((item) =>
        savedItemCommand(item, 'Recent', 'history', navigate),
      ),
    },
  ]
}
