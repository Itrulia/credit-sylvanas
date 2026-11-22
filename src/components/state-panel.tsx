import type { ReactNode } from 'react'
import type { IconName } from '#/lib/icons'
import { cn } from '#/lib/utils'
import { Icon } from './icon'

export interface StatePanelProps {
  title: ReactNode
  children?: ReactNode
  icon?: IconName
  /** the 404/503/500 pages use h1, empty states inside a section h2 or h3 */
  as?: 'h1' | 'h2' | 'h3'
  actions?: ReactNode
  /** focus target after a client navigation or a retry */
  headingId?: string
  className?: string
}

/** Shared layout for empty, error and not-found states. */
export function StatePanel({
  title,
  children,
  icon = 'info',
  as: Heading = 'h2',
  actions,
  headingId,
  className,
}: StatePanelProps) {
  return (
    <section
      className={cn(
        'flex flex-col items-start gap-3 rounded-md border p-6',
        className,
      )}
    >
      <Icon name={icon} size={40} className="text-muted-foreground" />
      <Heading
        id={headingId}
        tabIndex={-1}
        className={Heading === 'h1' ? 'text-display' : 'text-title'}
      >
        {title}
      </Heading>
      {children && (
        <div className="max-w-prose space-y-2 text-sm">{children}</div>
      )}
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </section>
  )
}
