import { useMemo } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { REGIONS, REGION_INFO, isRegion } from '#/config/regions'
import { realmsFor } from '#/config/realms'
import type { Faction, Region } from '#/lib/search'
import { setTheme } from '#/lib/theme'
import type { ThemeMode } from '#/lib/theme'
import type { Command } from '../command-palette/command'
import { Icon } from '../icon'

/** The region in the URL, or null on / and /about. */
export function useCurrentRegion(): Region | null {
  const { region } = useParams({ strict: false })
  return region && isRegion(region) ? region : null
}

const PAGES = [
  {
    id: 'market',
    title: 'Market',
    to: '/$region',
    keywords: ['home', 'hottest', 'movers'],
  },
  {
    id: 'items',
    title: 'Items',
    to: '/$region/items',
    keywords: ['browse', 'prices', 'search'],
  },
  {
    id: 'heatmaps',
    title: 'Heatmaps',
    to: '/$region/heatmap',
    keywords: ['regions', 'compare'],
  },
] as const

const THEMES: {
  mode: ThemeMode
  title: string
  icon?: 'light_mode' | 'dark_mode'
}[] = [
  { mode: 'light', title: 'Light', icon: 'light_mode' },
  { mode: 'dark', title: 'Dark', icon: 'dark_mode' },
  { mode: 'system', title: 'System' },
]

const FACTIONS: Faction[] = ['alliance', 'horde']

// search updaters below get loose types: the palette sits above every route
type LooseSearch = Record<string, unknown>
type LooseParams = Record<string, string>

/** Navigate, Region, Realm (only once realms.ts has entries) and Theme. */
export function useSiteCommands(): Command[] {
  const navigate = useNavigate()
  const current = useCurrentRegion()
  // / and /about have no region yet: commands default to US
  const region = current ?? 'us'

  return useMemo(() => {
    const realms = realmsFor(region)
    const chevron = <Icon name="chevron_right" />

    const pages: Command[] = PAGES.map((page) => ({
      id: `nav-${page.id}`,
      group: 'Navigate',
      title: page.title,
      keywords: [...page.keywords],
      icon: chevron,
      perform: () => void navigate({ to: page.to, params: { region } }),
    }))
    if (realms.length) {
      pages.push({
        id: 'nav-realms',
        group: 'Navigate',
        title: 'Realms',
        icon: chevron,
        perform: () =>
          void navigate({ to: '/$region/realms', params: { region } }),
      })
    }
    pages.push({
      id: 'nav-about',
      group: 'Navigate',
      title: 'About',
      keywords: ['data', 'sources', 'glossary'],
      icon: chevron,
      perform: () => void navigate({ to: '/about' }),
    })

    const regions: Command[] = REGIONS.map((code) => ({
      id: `region-${code}`,
      group: 'Region',
      title: `Switch to ${REGION_INFO[code].name}`,
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
            group: 'Realm',
            title: 'All realms (region)',
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
              group: 'Realm',
              title: `${realm.name} (${faction === 'alliance' ? 'Alliance' : 'Horde'})`,
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

    const themes: Command[] = THEMES.map((theme) => ({
      id: `theme-${theme.mode}`,
      group: 'Theme',
      title: theme.title,
      keywords: ['theme', 'mode', 'colour'],
      icon: theme.icon ? <Icon name={theme.icon} /> : undefined,
      perform: () => setTheme(theme.mode),
    }))

    return [...pages, ...regions, ...realmCommands, ...themes]
  }, [current, navigate, region])
}
