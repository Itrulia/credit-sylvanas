import { findRealm } from '#/config/realms'
import { Money } from '#/components/money'
import { Badge } from '#/components/ui/badge'
import type { Faction, Region } from '#/lib/search'
import { cn } from '#/lib/utils'
import { m } from '#/i18n'
import type { RealmPrice } from '#/server/types'

const RULESET = {
  normal: m.realms.rulesetNormal,
  pvp: m.realms.rulesetPvp,
  rp: m.realms.rulesetRp,
  'rp-pvp': m.realms.rulesetRpPvp,
}
const FACTION = {
  alliance: m.realms.factionAlliance,
  horde: m.realms.factionHorde,
}

/** Realm prices for the configured realms; absent while realms.ts is empty. */
export function RealmPrices({
  region,
  realms,
  realm,
  faction,
}: {
  region: Region
  realms: RealmPrice[]
  realm?: string
  faction?: Faction
}) {
  if (realms.length === 0) {
    return null
  }
  const isSelected = (r: RealmPrice) =>
    r.realm === realm && r.faction === faction
  // the selected realm is pinned first
  const rows = [...realms].sort(
    (a, b) => Number(isSelected(b)) - Number(isSelected(a)),
  )
  return (
    <section aria-labelledby="realms-heading" className="mt-8">
      <h2 id="realms-heading" className="text-title">
        {m.item.realmsHeading()}
      </h2>
      <div className="relative mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{m.item.realmsCaption()}</caption>
          <thead className="ledger-rule">
            <tr>
              <th scope="col" className="py-1 text-left">
                {m.item.realmColumn()}
              </th>
              <th scope="col" className="py-1 text-left">
                {m.shell.factionLabel()}
              </th>
              <th scope="col" className="py-1 text-left">
                {m.realms.rulesetLabel()}
              </th>
              <th scope="col" className="py-1 text-right">
                {m.shell.glossaryMarketValueLabel()}
              </th>
              <th scope="col" className="py-1 text-right">
                {m.shell.glossaryMinBuyoutLabel()}
              </th>
              <th scope="col" className="py-1 text-right">
                {m.shell.glossaryRecentLabel()}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const config = findRealm(region, r.realm)
              const noListings = r.minBuyout === 0
              return (
                <tr
                  key={`${r.realm}-${r.faction}`}
                  className={cn('border-b', isSelected(r) && 'bg-muted')}
                >
                  <th scope="row" className="py-2 text-left font-normal">
                    {config?.name ?? r.realm}
                  </th>
                  <td className="py-2">{FACTION[r.faction]()}</td>
                  <td className="py-2">
                    {config && (
                      <Badge variant="outline">
                        {RULESET[config.ruleset]()}
                      </Badge>
                    )}
                  </td>
                  <td
                    className={cn(
                      'py-2 text-right',
                      noListings && 'text-muted-foreground',
                    )}
                  >
                    <Money copper={r.mv} />
                  </td>
                  <td className="py-2 text-right">
                    {noListings ? (
                      m.item.noListings()
                    ) : (
                      <Money copper={r.minBuyout} />
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <Money copper={r.recent} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
