import {
  createFileRoute,
  notFound,
  stripSearchParams,
} from '@tanstack/react-router'
import type { NotFoundRouteProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { REGION_INFO, regionLabel } from '#/config/regions'
import { findRealm } from '#/config/realms'
import { Freshness } from '#/components/freshness'
import { FavouriteButton } from '#/components/item/favourite-button'
import { Icon } from '#/components/icon'
import { WowheadLink } from '#/components/wowhead-link'
import { Badge } from '#/components/ui/badge'
import { InfoPopover } from '#/components/info-popover'
import { ItemNotFound } from '#/components/item/item-not-found'
import { PriceBlock, isVolatile } from '#/components/item/price-block'
import { RealmPrices } from '#/components/item/realm-prices'
import { RegionStrip } from '#/components/item/region-strip'
import { StatsGrid } from '#/components/item/stats-grid'
import { m } from '#/i18n'
import { track } from '#/lib/analytics'
import { formatDate, formatNumber } from '#/lib/format'
import { formatMoney, moneyText } from '#/lib/money'
import { ITEM_DEFAULTS, ItemIdParam, itemSearch } from '#/lib/search'
import type { Region } from '#/lib/search'
import { rememberRecent } from '#/lib/saved-items'
import { pageHead } from '#/lib/seo'
import { itemName } from '#/lib/wowhead'
import { itemHistoryQuery, itemQuery } from '#/server/fns/item'
import { regionStatusQuery } from '#/server/fns/status'

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
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {}
    }
    const region = regionLabel(params.region)
    const { name, mv, spd } = loaderData
    return pageHead(
      m.item.headTitle({ name, region }),
      m.item.headDescription({
        name,
        region,
        value: moneyText(formatMoney(mv)),
        sold: formatNumber(spd, spd < 10 ? 1 : 0),
      }),
    )
  },
  component: ItemDetail,
  notFoundComponent: ItemMissing,
})

function ItemDetail() {
  const { region, itemId } = Route.useRouteContext()
  const deps = Route.useLoaderDeps()
  const input = { region, itemId, ...deps }
  const { data } = useSuspenseQuery(itemQuery(input))
  const { data: status } = useSuspenseQuery(regionStatusQuery({ region }))
  useEffect(() => track('item_view', { itemId, region }), [itemId, region])
  const storedName = data.item?.name
  useEffect(() => {
    if (storedName !== undefined) {
      rememberRecent({ region, itemId, name: storedName })
    }
  }, [itemId, region, storedName])
  if (!data.item || !data.current) {
    return null
  }
  const { item, current } = data
  const name = REGION_INFO[region].name
  const realmName = deps.realm
    ? (findRealm(region, deps.realm)?.name ?? deps.realm)
    : null
  const dropped = status.lastDay !== null && current.day < status.lastDay
  return (
    <div className="page-wrap py-6">
      <header className="flex flex-col gap-2">
        <h1 tabIndex={-1} className="text-display">
          {itemName(item.name, item.id)}
        </h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-mono text-muted-foreground">
            {m.item.idLabel({ id: item.id })}
          </span>
          <WowheadLink id={item.id} />
          <FavouriteButton region={region} itemId={item.id} name={item.name} />
          {isVolatile(current.mv, current.hist) && (
            <span className="inline-flex items-center">
              <Badge variant="outline">{m.item.volatileBadge()}</Badge>
              <InfoPopover term="volatile" />
            </span>
          )}
        </p>
      </header>

      {dropped && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-md border border-warning-border bg-warning-subtle px-3 py-2 text-sm"
        >
          <Icon name="warning" className="mt-0.5 text-warning-text" />
          <p>
            <strong>
              {m.item.droppedTitle({
                region: name,
                date: formatDate(status.lastDay ?? current.day),
              })}
            </strong>{' '}
            {m.item.droppedBody({ date: formatDate(current.day) })}
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PriceBlock current={current} />
          <p className="mt-2 text-sm text-muted-foreground">
            {m.item.regionAverageNote({ region: name })}
          </p>
        </div>
        <div className="lg:col-span-4">
          <RegionStrip
            itemId={item.id}
            region={region}
            regions={data.regions}
          />
        </div>
      </div>

      <StatsGrid input={input} realmName={realmName} />

      <RealmPrices
        region={region}
        realms={data.realms}
        realm={deps.realm}
        faction={deps.faction}
      />

      <Freshness
        className="mt-8"
        updatedAt={current.updatedAt}
        fetchedAt={status.fetchedAt}
      />
    </div>
  )
}

function ItemMissing({ data }: NotFoundRouteProps) {
  const { region } = Route.useParams()
  const value = (data as { value?: string } | undefined)?.value ?? ''
  if (!ItemIdParam.safeParse(value).success) {
    return (
      <ItemNotFound
        region={region as Region}
        value={value}
        result={undefined}
      />
    )
  }
  return <KnownIdMissing region={region as Region} itemId={Number(value)} />
}

function KnownIdMissing({
  region,
  itemId,
}: {
  region: Region
  itemId: number
}) {
  const { realm, faction } = Route.useSearch()
  // the loader already put this result in the cache
  const { data } = useSuspenseQuery(
    itemQuery({ region, itemId, realm, faction }),
  )
  return <ItemNotFound region={region} value={String(itemId)} result={data} />
}
