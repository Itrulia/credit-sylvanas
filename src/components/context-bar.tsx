import { Link } from '@tanstack/react-router'
import { REGION_INFO } from '#/config/regions'
import { findRealm, realmsFor } from '#/config/realms'
import type { Faction, Region } from '#/lib/search'
import { cn } from '#/lib/utils'
import { Freshness } from './freshness'
import { Icon } from './icon'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

export interface ContextBarProps {
  region: Region
  realm?: string
  faction?: Faction
  updatedAt: number | null
  fetchedAt: number | null
}

const FACTIONS: Faction[] = ['alliance', 'horde']

/** Realm button, faction toggle (realm set only) and the freshness stamp. */
export function ContextBar({
  region,
  realm,
  faction,
  updatedAt,
  fetchedAt,
}: ContextBarProps) {
  const realms = realmsFor(region)
  const selected = realm ? findRealm(region, realm) : undefined
  return (
    <div className="border-b bg-card">
      <div className="page-wrap flex min-h-10 flex-wrap items-center gap-3 py-1">
        <Popover>
          <PopoverTrigger className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-2 text-sm pointer-coarse:h-11">
            {selected ? `Realm: ${selected.name}` : 'All realms (region)'}
            <Icon name="expand_more" />
          </PopoverTrigger>
          <PopoverContent className="max-w-sm text-sm">
            {realms.length === 0 ? (
              <div className="space-y-2">
                <p className="font-semibold">
                  Realm prices aren't available yet.
                </p>
                <p>
                  Forever realm names aren't published anywhere, so we haven't
                  added any realms. Region prices below cover every{' '}
                  {REGION_INFO[region].name} realm.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                <li>
                  <Link
                    to="."
                    search={(prev: Record<string, unknown>) => ({
                      ...prev,
                      realm: undefined,
                      faction: undefined,
                    })}
                    className="underline"
                  >
                    All realms (region)
                  </Link>
                </li>
                {realms.map((r) => (
                  <li key={r.slug}>
                    <Link
                      to="."
                      search={(prev: Record<string, unknown>) => ({
                        ...prev,
                        realm: r.slug,
                        faction: faction ?? 'alliance',
                      })}
                      className="underline"
                    >
                      {r.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
        {selected && (
          <nav
            aria-label="Faction"
            className="flex rounded-md border border-input p-0.5"
          >
            {FACTIONS.map((f) => (
              <Link
                key={f}
                to="."
                search={(prev: Record<string, unknown>) => ({
                  ...prev,
                  faction: f,
                })}
                aria-current={f === faction ? 'true' : undefined}
                className={cn(
                  'rounded-sm px-2 py-1 text-xs font-semibold capitalize',
                  f === faction ? 'bg-accent' : 'text-muted-foreground',
                )}
              >
                {f}
              </Link>
            ))}
          </nav>
        )}
        <Freshness
          updatedAt={updatedAt}
          fetchedAt={fetchedAt}
          className="ml-auto"
        />
      </div>
    </div>
  )
}
