import { Link } from '@tanstack/react-router'
import type { z } from 'zod'
import { REGION_INFO } from '#/config/regions'
import { m } from '#/paraglide/messages.js'
import type { RealmConfig } from '#/config/realms'
import type { Faction, Region, RulesetFilter } from '#/lib/search'
import { StatePanel } from '../state-panel'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

export type RealmsFilter = z.infer<typeof RulesetFilter>

export const RULESET_LABEL: Record<RealmsFilter, string> = {
  all: m.realms_rulesetAll(),
  normal: m.realms_rulesetNormal(),
  pvp: m.realms_rulesetPvp(),
  rp: m.realms_rulesetRp(),
  'rp-pvp': m.realms_rulesetRpPvp(),
}

const FACTIONS: { id: Faction; label: string }[] = [
  { id: 'alliance', label: m.realms_factionAlliance() },
  { id: 'horde', label: m.realms_factionHorde() },
]

const factionLink =
  'inline-flex h-8 items-center rounded-md border border-input px-3 text-sm font-medium hover:bg-accent pointer-coarse:h-11'

export interface RealmListProps {
  region: Region
  /** realms of this region, from realms.ts */
  realms: readonly RealmConfig[]
  ruleset: RealmsFilter
}

export function RealmList({ region, realms, ruleset }: RealmListProps) {
  const name = REGION_INFO[region].name
  if (!realms.length) {
    return (
      <StatePanel title={m.realms_emptyTitle()}>
        <p>{m.realms_emptyBody({ region: name })}</p>
        <p>
          <Link to="/$region" params={{ region }} className="underline">
            {m.realms_emptyMarketLink({ region: name })}
          </Link>
        </p>
      </StatePanel>
    )
  }

  const shown =
    ruleset === 'all' ? realms : realms.filter((r) => r.ruleset === ruleset)
  if (!shown.length) {
    return (
      <StatePanel
        title={m.realms_filteredEmptyTitle({
          ruleset: RULESET_LABEL[ruleset],
          region: name,
        })}
        actions={
          <Button asChild variant="secondary">
            <Link
              to="/$region/realms"
              params={{ region }}
              search={{ ruleset: undefined }}
            >
              {m.realms_filteredEmptyShowAll()}
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul
      aria-label={m.realms_listLabel({ region: name })}
      className="divide-y rounded-md border"
    >
      {shown.map((realm) => (
        <li
          key={realm.slug}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
        >
          <span className="font-medium">{realm.name}</span>
          <Badge variant="outline">{RULESET_LABEL[realm.ruleset]}</Badge>
          <span className="ml-auto flex gap-2">
            {FACTIONS.map((faction) => (
              <Link
                key={faction.id}
                to="/$region"
                params={{ region }}
                search={{ realm: realm.slug, faction: faction.id }}
                aria-label={m.realms_factionLinkLabel({
                  realm: realm.name,
                  faction: faction.label,
                })}
                className={factionLink}
              >
                {faction.label}
              </Link>
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}
