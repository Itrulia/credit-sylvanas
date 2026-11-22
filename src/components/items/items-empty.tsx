import { Link } from '@tanstack/react-router'
import { Icon } from '#/components/icon'
import { ItemLink } from '#/components/item-link'
import { StatePanel } from '#/components/state-panel'
import { REGION_INFO } from '#/config/regions'
import { plural } from '#/lib/format'
import type { Region } from '#/lib/search'
import { wowheadItemUrl } from '#/lib/wowhead'
import type { HotRow } from '#/server/types'
import { countText } from './items-count'
import { lastPage } from './pager'

export const isNumericQuery = (q: string) => /^\d+$/.test(q)

export interface ItemsEmptyProps {
  region: Region
  q: string
  page: number
  total: number
  /** "Most sold right now" links, from getHottest({ by: 'traded', limit: 5 }) */
  popular?: HotRow[]
}

function MostSold({ region, rows }: { region: Region; rows: HotRow[] }) {
  if (rows.length === 0) {
    return null
  }
  return (
    <div className="space-y-2 pt-2">
      <h3 className="text-label">Most sold right now</h3>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.id}>
            <ItemLink
              id={row.id}
              name={row.name}
              region={region}
              className="underline"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The §8 Items states: page past end, numeric miss and no results. */
export function ItemsEmpty({
  region,
  q,
  page,
  total,
  popular = [],
}: ItemsEmptyProps) {
  const name = REGION_INFO[region].name
  if (total > 0) {
    const last = lastPage(total)
    return (
      <StatePanel
        title={`There is no page ${page}.`}
        actions={
          <Link
            from="/$region/items/"
            to="."
            search={(prev) => ({ ...prev, page: undefined })}
            className="inline-flex min-h-11 items-center underline"
          >
            Back to page 1
          </Link>
        }
      >
        <p>
          {countText(total, q)} fit on {plural(last, 'page', 'pages')}.
        </p>
        <MostSold region={region} rows={popular} />
      </StatePanel>
    )
  }
  if (isNumericQuery(q)) {
    return (
      <StatePanel title={`No item #${q} in ${name}.`}>
        <p>
          <a
            href={wowheadItemUrl(Number(q))}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1 underline"
          >
            Look it up on Wowhead
            <Icon name="open_in_new" />
            <span className="sr-only">(opens Wowhead)</span>
          </a>
        </p>
      </StatePanel>
    )
  }
  return (
    <StatePanel title={`No items match "${q}" in ${name}.`}>
      <p>
        Check the spelling, try part of the name ("Arcanite" instead of
        "Arcanite Bar"), or search by item ID.
      </p>
      <MostSold region={region} rows={popular} />
    </StatePanel>
  )
}
