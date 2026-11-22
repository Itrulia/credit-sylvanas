import { Link, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { z } from 'zod'
import { REGIONS, REGION_INFO, isRegion } from '#/config/regions'
import { LOCALE, m } from '#/i18n'
import { track } from '#/lib/analytics'
import { SITE } from '#/lib/seo'
import { CommandPaletteTrigger } from './command-palette/command-palette-trigger'
import { StatePanel } from './state-panel'

// what $region's beforeLoad passes to notFound({ data })
const Missing = z.object({
  kind: z.enum(['region', 'realm', 'item']),
  value: z.string(),
})

const link = 'underline'

/** Router default 404. The status comes from throw notFound() in loaders. */
// typed loosely on purpose: NotFoundRouteProps makes the router type circular
export function NotFound({ data }: { data?: unknown }) {
  const params = useParams({ strict: false })
  // / and unknown regions fall back to NA (code 'us') for the next step
  const region = params.region && isRegion(params.region) ? params.region : 'us'
  const name = REGION_INFO[region].name
  const missing = Missing.safeParse(data)
  const kind = missing.success ? missing.data.kind : null
  const value = missing.success ? missing.data.value : ''
  useEffect(() => track('error_page', { status: 404 }), [])

  return (
    <div className="page-wrap py-8">
      <title>
        {m.shell.docTitle({ page: m.shell.notFoundDocPage(), site: SITE })}
      </title>
      <meta name="robots" content="noindex" />
      {kind === 'region' ? (
        <StatePanel
          as="h1"
          icon="search"
          title={m.shell.notFoundRegionTitle({ value })}
        >
          <p>
            {m.shell.notFoundRegionList({
              regions: new Intl.ListFormat(LOCALE).format(
                REGIONS.map((r) => REGION_INFO[r].name),
              ),
            })}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {REGIONS.map((r) => (
              <li key={r}>
                <Link to="/$region" params={{ region: r }} className={link}>
                  {REGION_INFO[r].name}
                  <span className="text-muted-foreground">
                    {' '}
                    {REGION_INFO[r].fullName}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </StatePanel>
      ) : kind === 'realm' ? (
        <StatePanel
          as="h1"
          icon="search"
          title={m.shell.notFoundRealmTitle({ value })}
        >
          <p>
            <Link to="/$region" params={{ region }} className={link}>
              {m.shell.notFoundRealmLink({ region: name })}
            </Link>
          </p>
        </StatePanel>
      ) : (
        <StatePanel
          as="h1"
          icon="search"
          title={m.shell.notFoundTitle()}
          actions={<CommandPaletteTrigger className="h-11 sm:w-80" />}
        >
          <p>{m.shell.notFoundBody()}</p>
          <p>
            <Link to="/$region" params={{ region }} className={link}>
              {m.shell.notFoundMarketLink({ region: name })}
            </Link>
          </p>
        </StatePanel>
      )}
    </div>
  )
}
