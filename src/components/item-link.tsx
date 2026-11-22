import { Link } from '@tanstack/react-router'
import type { Region } from '#/lib/search'
import { itemName, wowheadData } from '#/lib/wowhead'
import { cn } from '#/lib/utils'

export interface ItemLinkProps {
  id: number
  name: string
  region: Region
  className?: string
  /** per-link override for the Wowhead icon, e.g. 'medium' */
  iconSize?: 'tiny' | 'small' | 'medium' | 'large'
}

/**
 * Internal link to item detail. The Wowhead script inserts its icon as the
 * first child of the <a>, so React only ever owns the inner name span.
 */
export function ItemLink({
  id,
  name,
  region,
  className,
  iconSize,
}: ItemLinkProps) {
  return (
    <Link
      to="/$region/items/$itemId"
      params={{ region, itemId: String(id) }}
      data-wowhead={wowheadData(id)}
      data-wh-icon-size={iconSize}
      className={cn('hover:underline', className)}
    >
      <span>{itemName(name, id)}</span>
    </Link>
  )
}
