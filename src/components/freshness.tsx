import { formatDateTime, isoFromUnix } from '#/lib/format'
import { cn } from '#/lib/utils'
import { Credit } from './credit'

export function DateTime({ unix }: { unix: number }) {
  return <time dateTime={isoFromUnix(unix)}>{formatDateTime(unix)}</time>
}

export interface FreshnessProps {
  updatedAt: number | null
  fetchedAt: number | null
  className?: string
}

/** "Pricing data from TradeSkillMaster · Prices from TSM scan {date}, imported {date}" */
export function Freshness({ updatedAt, fetchedAt, className }: FreshnessProps) {
  return (
    <p className={cn('text-micro text-muted-foreground', className)}>
      <Credit />
      {updatedAt !== null && (
        <>
          {' · '}Prices from TSM scan <DateTime unix={updatedAt} />
          {fetchedAt !== null && (
            <>
              , imported <DateTime unix={fetchedAt} />
            </>
          )}
        </>
      )}
    </p>
  )
}
