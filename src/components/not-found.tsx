import { Link, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { z } from 'zod'
import { REGIONS, REGION_INFO, isRegion } from '#/config/regions'
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
      <title>{`Page not found · ${SITE}`}</title>
      <meta name="robots" content="noindex" />
      {kind === 'region' ? (
        <StatePanel
          as="h1"
          icon="search"
          title={`There's no "${value}" region.`}
        >
          <p>
            Prices are available for{' '}
            {REGIONS.map((r) => REGION_INFO[r].name).join(' and ')}.
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
          title={`We don't track "${value}" yet.`}
        >
          <p>
            <Link to="/$region" params={{ region }} className={link}>
              See {name} region prices
            </Link>
          </p>
        </StatePanel>
      ) : (
        <StatePanel
          as="h1"
          icon="search"
          title="Page not found."
          actions={<CommandPaletteTrigger className="h-11 sm:w-80" />}
        >
          <p>That page doesn't exist. Try searching for an item instead.</p>
          <p>
            <Link to="/$region" params={{ region }} className={link}>
              Go to {name} market
            </Link>
          </p>
        </StatePanel>
      )}
    </div>
  )
}
