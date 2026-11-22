import {
  Outlet,
  createFileRoute,
  notFound,
  redirect,
  retainSearchParams,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { isRegion } from '#/config/regions'
import { findRealm } from '#/config/realms'
import { ContextBar } from '#/components/context-bar'
import { ErrorPage } from '#/components/error-page'
import { NoData } from '#/components/no-data'
import { StaleBanner, isStale } from '#/components/stale-banner'
import { noDataError, noDataRegion } from '#/lib/errors'
import { contextSearch } from '#/lib/search'
import type { Region } from '#/lib/search'
import { regionStatusQuery } from '#/server/fns/status'

export const Route = createFileRoute('/$region')({
  ssr: true,
  validateSearch: contextSearch,
  search: { middlewares: [retainSearchParams(['realm', 'faction'])] },
  // beforeLoad runs before every child loader, so 404/503 win before any data work
  beforeLoad: async ({ params, search, location, context }) => {
    if (!isRegion(params.region)) {
      throw notFound({ data: { kind: 'region', value: params.region } })
    }
    const region = params.region
    if (search.realm !== undefined) {
      if (!findRealm(region, search.realm)) {
        throw notFound({ data: { kind: 'realm', value: search.realm } })
      }
      if (!search.faction) {
        const qs = new URLSearchParams(location.search)
        qs.set('faction', 'alliance')
        throw redirect({ href: `${location.pathname}?${qs}` })
      }
    }
    const status = await context.queryClient.ensureQueryData(
      regionStatusQuery({ region }),
    )
    if (!status.hasData) {
      // getRegionStatus already set 503 and no-store on the response
      throw noDataError(region)
    }
    return { region }
  },
  component: RegionLayout,
  errorComponent: RegionError,
})

function RegionLayout() {
  const { region } = Route.useRouteContext()
  const { realm, faction } = Route.useSearch()
  const { data: status } = useSuspenseQuery(regionStatusQuery({ region }))
  return (
    <>
      <ContextBar
        region={region}
        realm={realm}
        faction={faction}
        updatedAt={status.updatedAt}
        fetchedAt={status.fetchedAt}
      />
      {isStale(status.updatedAt, Date.now() / 1000) &&
        status.updatedAt !== null && (
          <div className="page-wrap pt-3">
            <StaleBanner updatedAt={status.updatedAt} />
          </div>
        )}
      <Outlet />
    </>
  )
}

function RegionError(props: ErrorComponentProps) {
  const region = noDataRegion(props.error)
  if (region && isRegion(region)) {
    return <RegionNoData region={region} />
  }
  return <ErrorPage {...props} />
}

function RegionNoData({ region }: { region: Region }) {
  const { data: status } = useSuspenseQuery(regionStatusQuery({ region }))
  return <NoData region={region} status={status} />
}
