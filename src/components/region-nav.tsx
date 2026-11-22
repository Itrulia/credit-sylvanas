import { Link } from '@tanstack/react-router'
import { DISABLED_REGIONS, REGIONS, REGION_INFO } from '#/config/regions'
import { m } from '#/paraglide/messages.js'
import type { Region } from '#/lib/search'
import { track } from '#/lib/analytics'
import { cn } from '#/lib/utils'

/**
 * Real links styled as a segmented control. Switching keeps the subpath and
 * search but drops realm/faction: $region retains them, so they must be
 * cleared explicitly (a key left out is retained).
 */
export function RegionNav({
  current,
  className,
}: {
  current: Region | null
  className?: string
}) {
  return (
    <nav aria-label={m.shell_regionNavLabel()} className={className}>
      <ul className="flex rounded-md border border-input p-0.5">
        {REGIONS.map((region) => (
          <li key={region}>
            <Link
              to="."
              params={(prev: Record<string, string>) => ({ ...prev, region })}
              search={(prev: Record<string, unknown>) => ({
                ...prev,
                realm: undefined,
                faction: undefined,
              })}
              onClick={() => {
                if (region !== current) {
                  track('region_switch', { region })
                }
              }}
              aria-current={region === current ? 'page' : undefined}
              title={REGION_INFO[region].fullName}
              className={cn(
                'relative inline-flex h-8 min-w-10 items-center justify-center rounded-sm px-2 text-xs font-semibold pointer-coarse:h-11',
                region === current
                  ? 'bg-accent after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:bg-brand-tomato'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {REGION_INFO[region].name}
            </Link>
          </li>
        ))}
        {DISABLED_REGIONS.map((r) => (
          <li key={r.code}>
            <span
              role="link"
              aria-disabled="true"
              title={m.shell_regionComingLater({ region: r.fullName })}
              className="inline-flex h-8 min-w-10 cursor-not-allowed items-center justify-center rounded-sm px-2 text-xs font-semibold text-muted-foreground/50 pointer-coarse:h-11"
            >
              {r.name}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  )
}
