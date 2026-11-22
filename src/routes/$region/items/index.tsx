import {
  createFileRoute,
  stripSearchParams,
  useRouterState,
} from '@tanstack/react-router'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { ItemsCount } from '#/components/items/items-count'
import { ItemsEmpty, isNumericQuery } from '#/components/items/items-empty'
import { ItemsSearchInput } from '#/components/items/items-search-input'
import { ItemsTable, nextSort } from '#/components/items/items-table'
import { Pager } from '#/components/items/pager'
import { ITEMS_DEFAULTS, itemsSearch } from '#/lib/search'
import type { Region } from '#/lib/search'
import { pageHead } from '#/lib/seo'
import { listItemsQuery } from '#/server/fns/items'
import type { ListInput } from '#/server/fns/inputs'
import { hottestQuery } from '#/server/fns/market'

const popularQuery = (region: Region) =>
  hottestQuery({ region, by: 'traded', limit: 5 })

export const Route = createFileRoute('/$region/items/')({
  ssr: true,
  validateSearch: itemsSearch,
  search: { middlewares: [stripSearchParams(ITEMS_DEFAULTS)] },
  loaderDeps: ({ search: { q, sort, dir, page, realm, faction } }) => ({
    q,
    sort,
    dir,
    page,
    realm,
    faction,
  }),
  // Awaited: the table is the page. On client navigations the router keeps the old rows on screen until this resolves.
  loader: async ({ context, deps }) => {
    const { queryClient, region } = context
    const list = await queryClient.ensureQueryData(
      listItemsQuery({ region, ...deps }),
    )
    if (list.rows.length === 0 && !isNumericQuery(deps.q)) {
      await queryClient.ensureQueryData(popularQuery(region))
    }
  },
  head: ({ params }) => {
    const name = params.region.toUpperCase()
    return pageHead(
      `Item prices · ${name} Forever AH`,
      `Search and sort every item on the ${name} Forever auction house by market value, sale rate and daily sales.`,
    )
  },
  component: Items,
})

function Items() {
  const { region } = Route.useRouteContext()
  const deps = Route.useLoaderDeps()
  const { q, sort, dir, page, realm, faction } = deps
  const navigate = Route.useNavigate()
  const busy = useRouterState({ select: (s) => s.isLoading })
  const input: ListInput = { region, ...deps }
  const { data } = useSuspenseQuery(listItemsQuery(input))
  const empty = data.rows.length === 0
  const { data: popular } = useQuery({
    ...popularQuery(region),
    enabled: empty && !isNumericQuery(q),
  })
  return (
    <div className="page-wrap space-y-4 py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="text-display">Item prices</h1>
        <ItemsSearchInput
          q={q}
          className="md:w-96"
          onSearch={(next) =>
            navigate({
              search: (prev) => ({
                ...prev,
                q: next || undefined,
                page: undefined,
              }),
              replace: true,
            })
          }
        />
      </div>
      <ItemsCount total={data.total} q={q} busy={busy} />
      {empty ? (
        <ItemsEmpty
          region={region}
          q={q}
          page={page}
          total={data.total}
          popular={popular}
        />
      ) : (
        <>
          <ItemsTable
            region={region}
            rows={data.rows}
            sort={sort}
            dir={dir}
            busy={busy}
            withRealm={Boolean(realm && faction)}
            onSort={(column) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  ...nextSort({ sort, dir }, column),
                  page: undefined,
                }),
              })
            }
          />
          <Pager page={page} total={data.total} />
        </>
      )}
    </div>
  )
}
