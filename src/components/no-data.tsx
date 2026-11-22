import { Link } from '@tanstack/react-router'
import { REGION_INFO } from '#/config/regions'
import { m } from '#/i18n'
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
    <p className="text-muted-foreground">{m.shell.noDataDevHint()}</p>
  )
  if (status.regionsWithData.length === 0) {
    return (
      <div className="page-wrap py-8">
        <title>
          {m.shell.docTitle({ page: m.shell.noDataTitle(), site: SITE })}
        </title>
        <StatePanel as="h1" icon="info" title={m.shell.noDataTitle()}>
          <p>{m.shell.noDataBody()}</p>
          {devHint}
        </StatePanel>
      </div>
    )
  }
  return (
    <div className="page-wrap py-8">
      <title>
        {m.shell.docTitle({
          page: m.shell.noDataRegionTitle({ region: name }),
          site: SITE,
        })}
      </title>
      <StatePanel
        as="h1"
        icon="info"
        title={m.shell.noDataRegionTitle({ region: name })}
      >
        <p>
          {m.shell.noDataRegionLead({ region: name })}{' '}
          {status.fetchedAt ? (
            <DateTime unix={status.fetchedAt} />
          ) : (
            m.shell.noDataNoneYet()
          )}
          {m.shell.noDataRegionTail()}
        </p>
        {others.length > 0 && (
          <ul className="flex gap-3">
            {others.map((r) => (
              <li key={r}>
                <Link
                  to="/$region"
                  params={{ region: r }}
                  className="inline-flex min-h-6 min-w-11 items-center underline pointer-coarse:min-h-11"
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
