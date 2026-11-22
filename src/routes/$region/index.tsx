import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ItemLink } from '#/components/item-link'
import { Money } from '#/components/money'
import { REGION_INFO } from '#/config/regions'
import { MARKET_DEFAULTS, marketSearch } from '#/lib/search'
import { pageHead } from '#/lib/seo'
import { hottestQuery } from '#/server/fns/market'

// Stub: WP1 owns this page. The list below only proves SSR + Query wiring.
export const Route = createFileRoute('/$region/')({
  ssr: true,
  validateSearch: marketSearch,
  search: { middlewares: [stripSearchParams(MARKET_DEFAULTS)] },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      hottestQuery({ region: context.region, by: 'gold', limit: 20 }),
    )
  },
  head: ({ params }) => {
    const name = params.region.toUpperCase()
    return pageHead(
      `${name} Forever auction house prices`,
      `Daily WoW Forever auction house prices for ${name}: most traded items, biggest price moves and price history. Pricing data from TradeSkillMaster.`,
    )
  },
  component: Market,
})

function Market() {
  const { region } = Route.useRouteContext()
  const { data } = useSuspenseQuery(
    hottestQuery({ region, by: 'gold', limit: 20 }),
  )
  return (
    <div className="page-wrap py-6">
      <h1 className="text-display">{REGION_INFO[region].name} auction house</h1>
      <ol className="mt-4 space-y-1 text-sm">
        {data.map((row) => (
          <li key={row.id} className="flex justify-between gap-4 border-b py-1">
            <ItemLink id={row.id} name={row.name} region={region} />
            <Money copper={row.mv} variant="compact" />
          </li>
        ))}
      </ol>
    </div>
  )
}
