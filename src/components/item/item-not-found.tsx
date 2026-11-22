import { Link } from '@tanstack/react-router'
import { REGION_INFO } from '#/config/regions'
import { NotFound } from '#/components/not-found'
import { StatePanel } from '#/components/state-panel'
import { WowheadLink } from '#/components/wowhead-link'
import { SITE } from '#/lib/seo'
import type { Region } from '#/lib/search'
import { itemName } from '#/lib/wowhead'
import type { ItemResult } from '#/server/types'

export interface ItemNotFoundProps {
  region: Region
  /** the raw param; anything that is not a valid id gets the generic 404 */
  value: string
  /** the getItem result, when the id was valid */
  result: ItemResult | undefined
}

/** 404 for an item: listed elsewhere, or unknown everywhere (DESIGN §8). */
export function ItemNotFound({ region, value, result }: ItemNotFoundProps) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0 || String(id) !== value) {
    return <NotFound />
  }
  const name = REGION_INFO[region].name
  const item = result?.item
  if (!item) {
    const title = `We don't have prices for item #${id}.`
    return (
      <div className="page-wrap py-8">
        <title>{`Item #${id} not found · ${SITE}`}</title>
        <meta name="robots" content="noindex" />
        <StatePanel as="h1" icon="search" title={title}>
          <p>It may not be tradable, or nobody has listed it yet.</p>
          <p className="flex flex-wrap gap-3">
            <WowheadLink id={id} />
            <Link to="/$region/items" params={{ region }} className="underline">
              Search items
            </Link>
          </p>
        </StatePanel>
      </div>
    )
  }
  const label = itemName(item.name, item.id)
  const elsewhere = result.regions.filter(
    (r) => r.region !== region && r.mv !== null && r.mv > 0,
  )
  return (
    <div className="page-wrap py-8">
      <title>{`${label} isn't on the ${name} auction house · ${SITE}`}</title>
      <meta name="robots" content="noindex" />
      <StatePanel
        as="h1"
        icon="search"
        title={`${label} isn't on the ${name} auction house.`}
      >
        {elsewhere.length > 0 && (
          <p>
            It's listed in:{' '}
            {elsewhere.map((r, i) => (
              <span key={r.region}>
                {i > 0 && ', '}
                <Link
                  to="/$region/items/$itemId"
                  params={{ region: r.region, itemId: String(item.id) }}
                  className="underline"
                >
                  {REGION_INFO[r.region].name}
                </Link>
              </span>
            ))}
            .
          </p>
        )}
        <p>
          <WowheadLink id={item.id} />
        </p>
      </StatePanel>
    </div>
  )
}
