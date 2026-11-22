import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import type { Region } from '#/lib/search'
import { iconOnlyTooltip, itemName, tagForWowhead } from '#/lib/wowhead'
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
  const tag = useMemo(() => tagForWowhead(id), [id])
  return (
    <Link
      to="/$region/items/$itemId"
      params={{ region, itemId: String(id) }}
      ref={tag}
      data-item-link
      data-wh-icon-size={iconSize}
      title={itemName(name, id)}
      className={cn(
        'inline-flex max-w-full min-w-0 items-center align-bottom hover:underline',
        className,
      )}
    >
      <span ref={iconOnlyTooltip} className="min-w-0 truncate">
        {itemName(name, id)}
      </span>
    </Link>
  )
}
