import { Link } from '@tanstack/react-router'
import { REGION_INFO } from '#/config/regions'
import type { Region } from '#/lib/search'
import { SITE } from '#/lib/seo'
import type { RegionStatus } from '#/server/types'
import { DateTime } from './freshness'
import { StatePanel } from './state-panel'

interface NoDataProps {
  region: Region
  status: Pick<RegionStatus, 'fetchedAt' | 'regionsWithData'>
}

/** The 503 page: this region has no import yet, or no region has. */
export function NoData({ region, status }: NoDataProps) {
  const name = REGION_INFO[region].name
  const others = status.regionsWithData.filter((r) => r !== region)
  const devHint = import.meta.env.DEV && (
    <p className="text-muted-foreground">
      Dev only: run pnpm db:seed to load local data.
    </p>
  )
  if (status.regionsWithData.length === 0) {
    return (
      <div className="page-wrap py-8">
        <title>{`No prices yet · ${SITE}`}</title>
        <StatePanel as="h1" icon="info" title="No prices yet">
          <p>
            This site hasn't finished its first daily price update. Prices
            appear here after it runs.
          </p>
          {devHint}
        </StatePanel>
      </div>
    )
  }
  return (
    <div className="page-wrap py-8">
      <title>{`No ${name} prices yet · ${SITE}`}</title>
      <StatePanel as="h1" icon="info" title={`No ${name} prices yet`}>
        <p>
          We haven't saved a price update for {name}. Last successful import:{' '}
          {status.fetchedAt ? <DateTime unix={status.fetchedAt} /> : 'none yet'}
          . Try another region in the meantime.
        </p>
        {others.length > 0 && (
          <ul className="flex gap-3">
            {others.map((r) => (
              <li key={r}>
                <Link
                  to="/$region"
                  params={{ region: r }}
                  className="underline"
                >
                  {REGION_INFO[r].name}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {devHint}
      </StatePanel>
    </div>
  )
}
