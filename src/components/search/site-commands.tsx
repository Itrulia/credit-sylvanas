import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { REGIONS, REGION_INFO, isRegion } from '#/config/regions'
import { realmsFor } from '#/config/realms'
import { m } from '#/i18n'
import {
  readLastRegion,
  rememberRegion,
  subscribeLastRegion,
} from '#/lib/last-region'
import type { Faction, Region } from '#/lib/search'
import type { Command } from '../command-palette/command'
import { Icon } from '../icon'

/** The region in the URL, or null on / and /about. */
export function useCurrentRegion(): Region | null {
  const { region } = useParams({ strict: false })
  return region && isRegion(region) ? region : null
}

/**
 * The URL region, else the last one this viewer opened, else US. Pages
 * without a region (/, /about, a 404) use it for nav and palette.
 */
export function useRegion(): Region {
  const current = useCurrentRegion()
  // the server snapshot is null, so hydration renders US first, then the
  // remembered region
  const last = useSyncExternalStore(
    subscribeLastRegion,
    readLastRegion,
    () => null,
  )
  useEffect(() => {
    if (current) {
      rememberRegion(current)
    }
  }, [current])
  return current ?? last ?? 'us'
}

const PAGES = [
  {
    id: 'market',
    title: m.palette.navMarket,
    to: '/$region',
    keywords: ['home', 'hottest', 'movers'],
  },
  {
    id: 'items',
    title: m.palette.navItems,
    to: '/$region/items',
    keywords: ['browse', 'prices', 'search'],
  },
  {
    id: 'heatmaps',
    title: m.palette.navHeatmaps,
    to: '/$region/heatmap',
    keywords: ['regions', 'compare'],
  },
] as const

const FACTIONS: Faction[] = ['alliance', 'horde']

// search updaters below get loose types: the palette sits above every route
type LooseSearch = Record<string, unknown>
type LooseParams = Record<string, string>

/** Navigate, Region and Realm (only once realms.ts has entries). */
export function useSiteCommands(): Command[] {
  const navigate = useNavigate()
  const current = useCurrentRegion()
  const region = useRegion()

  return useMemo(() => {
    const realms = realmsFor(region)
    const chevron = <Icon name="chevron_right" />

    const pages: Command[] = PAGES.map((page) => ({
      id: `nav-${page.id}`,
      group: m.palette.groupNavigate(),
      title: page.title(),
      keywords: [...page.keywords],
      icon: chevron,
      perform: () => void navigate({ to: page.to, params: { region } }),
    }))
    if (realms.length) {
      pages.push({
        id: 'nav-realms',
        group: m.palette.groupNavigate(),
        title: m.palette.navRealms(),
        icon: chevron,
        perform: () =>
          void navigate({ to: '/$region/realms', params: { region } }),
      })
    }
    pages.push({
      id: 'nav-about',
      group: m.palette.groupNavigate(),
      title: m.palette.navAbout(),
      keywords: ['data', 'sources', 'glossary'],
      icon: chevron,
      perform: () => void navigate({ to: '/about' }),
    })

    const regions: Command[] = REGIONS.map((code) => ({
      id: `region-${code}`,
      group: m.palette.groupRegion(),
      title: m.palette.switchRegion({ region: REGION_INFO[code].name }),
      keywords: [REGION_INFO[code].fullName],
      perform: () =>
        void (current
          ? // same rules as the region links: keep page and search, drop realm/faction
            navigate({
              to: '.',
              params: (prev: LooseParams) => ({ ...prev, region: code }),
              search: (prev: LooseSearch) => ({
                ...prev,
                realm: undefined,
                faction: undefined,
              }),
            })
          : navigate({ to: '/$region', params: { region: code } })),
    }))

    const realmCommands: Command[] = realms.length
      ? [
          {
            id: 'realm-all',
            group: m.palette.groupRealm(),
            title: m.palette.realmAll(),
            perform: () =>
              void navigate({
                to: '.',
                search: (prev: LooseSearch) => ({
                  ...prev,
                  realm: undefined,
                  faction: undefined,
                }),
              }),
          },
          ...realms.flatMap((realm) =>
            FACTIONS.map((faction) => ({
              id: `realm-${realm.slug}-${faction}`,
              group: m.palette.groupRealm(),
              title: m.palette.realmFaction({
                realm: realm.name,
                faction:
                  faction === 'alliance'
                    ? m.realms.factionAlliance()
                    : m.realms.factionHorde(),
              }),
              keywords: [realm.ruleset],
              perform: () =>
                void navigate({
                  to: current ? '.' : '/$region',
                  params: { region },
                  search: (prev: LooseSearch) => ({
                    ...prev,
                    realm: realm.slug,
                    faction,
                  }),
                }),
            })),
          ),
        ]
      : []

    return [...pages, ...regions, ...realmCommands]
  }, [current, navigate, region])
}
