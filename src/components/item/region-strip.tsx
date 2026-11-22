import { Link } from '@tanstack/react-router'
import { REGION_INFO } from '#/config/regions'
import { Delta } from '#/components/delta'
import { InfoPopover } from '#/components/info-popover'
import { Money } from '#/components/money'
import type { Region } from '#/lib/search'
import { cn } from '#/lib/utils'
import type { RegionCell } from '#/server/types'

/** The item in all four regions: compact value and index vs the cross-region median. */
export function RegionStrip({
  itemId,
  region,
  regions,
}: {
  itemId: number
  region: Region
  regions: RegionCell[]
}) {
  return (
    <section
      aria-labelledby="regions-heading"
      className="rounded-md border p-4"
    >
      <h2
        id="regions-heading"
        className="mb-2 flex items-center gap-1 text-label"
      >
        All regions
        <InfoPopover term="index" />
      </h2>
      <table className="w-full text-sm">
        <caption className="sr-only">
          Market value in each region against the other regions
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Region</th>
            <th scope="col">Market value</th>
            <th scope="col">vs other regions</th>
          </tr>
        </thead>
        <tbody>
          {regions.map((r) => (
            <tr
              key={r.region}
              className={cn(
                'border-b last:border-0',
                r.region === region && 'font-semibold',
              )}
            >
              <th scope="row" className="py-2 text-left font-[inherit]">
                <Link
                  to="/$region/items/$itemId"
                  params={{ region: r.region, itemId: String(itemId) }}
                  search={(prev) => ({
                    ...prev,
                    realm: undefined,
                    faction: undefined,
                  })}
                  aria-current={r.region === region ? 'page' : undefined}
                  className="inline-flex min-h-6 min-w-11 items-center underline pointer-coarse:min-h-11"
                >
                  {REGION_INFO[r.region].name}
                </Link>
              </th>
              <td className="py-2 text-right">
                <Money
                  copper={r.mv}
                  variant="compact"
                  reason={`Not listed in ${REGION_INFO[r.region].name}`}
                />
              </td>
              <td className="py-2 pl-3 text-right">
                <Delta value={r.index} mode="vsMedian" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
