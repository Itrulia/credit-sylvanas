import type { ReactNode } from 'react'
import { wowheadData, wowheadItemUrl } from '#/lib/wowhead'
import { track } from '#/lib/analytics'
import { cn } from '#/lib/utils'
import { Icon } from './icon'

export function WowheadLink({
  id,
  children = 'View on Wowhead',
  className,
}: {
  id: number
  children?: ReactNode
  className?: string
}) {
  return (
    <a
      href={wowheadItemUrl(id)}
      data-wowhead={wowheadData(id)}
      className={cn('inline-flex items-center gap-1 underline', className)}
      onClick={() => track('outbound_wowhead', { itemId: id })}
      rel="noreferrer"
      target="_blank"
    >
      <span>{children}</span>
      <Icon name="open_in_new" />
      <span className="sr-only">(opens Wowhead)</span>
    </a>
  )
}
