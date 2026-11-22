import { Link } from '@tanstack/react-router'
import type { z } from 'zod'
import { REGION_INFO } from '#/config/regions'
import type { RealmConfig } from '#/config/realms'
import type { Faction, Region, RulesetFilter } from '#/lib/search'
import { StatePanel } from '../state-panel'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

export type RealmsFilter = z.infer<typeof RulesetFilter>

export const RULESET_LABEL: Record<RealmsFilter, string> = {
  all: 'All',
  normal: 'Normal',
  pvp: 'PvP',
  rp: 'RP',
  'rp-pvp': 'RP-PvP',
}

const FACTIONS: { id: Faction; label: string }[] = [
  { id: 'alliance', label: 'Alliance' },
  { id: 'horde', label: 'Horde' },
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
      <StatePanel title="No realms on the books yet.">
        <p>
          TSM publishes no Forever realm list, so we add realms by hand. Region
          prices cover every realm in {name}.
        </p>
        <p>
          <Link to="/$region" params={{ region }} className="underline">
            Go to {name} market
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
        title={`No ${RULESET_LABEL[ruleset]} realms added for ${name}.`}
        actions={
          <Button asChild variant="secondary">
            <Link
              to="/$region/realms"
              params={{ region }}
              search={{ ruleset: undefined }}
            >
              Show all realm types
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul aria-label={`${name} realms`} className="divide-y rounded-md border">
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
                aria-label={`${realm.name} ${faction.label}`}
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
