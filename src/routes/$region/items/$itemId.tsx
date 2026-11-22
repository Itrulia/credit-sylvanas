import {
  createFileRoute,
  notFound,
  stripSearchParams,
} from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Money } from '#/components/money'
import { WowheadLink } from '#/components/wowhead-link'
import { ITEM_DEFAULTS, ItemIdParam, itemSearch } from '#/lib/search'
import { pageHead } from '#/lib/seo'
import { itemName } from '#/lib/wowhead'
import { itemHistoryQuery, itemQuery } from '#/server/fns/item'

// Stub: WP3 owns this page. WP0 owns the 404 plumbing below.
export const Route = createFileRoute('/$region/items/$itemId')({
  ssr: true,
  validateSearch: itemSearch,
  search: { middlewares: [stripSearchParams(ITEM_DEFAULTS)] },
  beforeLoad: ({ params }) => {
    const parsed = ItemIdParam.safeParse(params.itemId)
    if (!parsed.success || String(parsed.data) !== params.itemId) {
      throw notFound({ data: { kind: 'item', value: params.itemId } })
    }
    return { itemId: parsed.data }
  },
  // the four ranges filter the 90-day payload in render and never refetch
  loaderDeps: ({ search }) => ({
    realm: search.realm,
    faction: search.faction,
  }),
  loader: async ({ context, deps }) => {
    const input = { region: context.region, itemId: context.itemId, ...deps }
    const item = await context.queryClient.ensureQueryData(itemQuery(input))
    if (!item.item || !item.current) {
      throw notFound({
        data: { kind: 'item', value: String(context.itemId), item: item.item },
      })
    }
    void context.queryClient.prefetchQuery(itemHistoryQuery(input))
    return {
      name: itemName(item.item.name, item.item.id),
      mv: item.current.mv,
      spd: item.current.spd,
    }
  },
  head: ({ params, loaderData }) =>
    loaderData
      ? pageHead(
          `${loaderData.name} price · ${params.region.toUpperCase()} Forever AH`,
          `${loaderData.name} on the ${params.region.toUpperCase()} Forever auction house. Price history updated daily.`,
        )
      : {},
  component: ItemDetail,
})

function ItemDetail() {
  const { region, itemId } = Route.useRouteContext()
  const deps = Route.useLoaderDeps()
  const { data } = useSuspenseQuery(itemQuery({ region, itemId, ...deps }))
  if (!data.item || !data.current) {
    return null
  }
  return (
    <div className="page-wrap py-6">
      <h1 className="text-display">{itemName(data.item.name, data.item.id)}</h1>
      <p className="font-mono text-micro">#{data.item.id}</p>
      <p className="mt-2">
        <Money copper={data.current.mv} />
      </p>
      <WowheadLink id={data.item.id} />
    </div>
  )
}
