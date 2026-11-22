import type { RegionCode } from './regions.ts'

export type Ruleset = 'normal' | 'pvp' | 'rp' | 'rp-pvp'

export interface RealmConfig {
  region: RegionCode
  slug: string
  name: string
  ruleset: Ruleset
}

// Forever realm names are not published anywhere. Add entries by hand only;
// never guess or probe the TSM bucket. Each entry ingests both factions.
export const REALMS: readonly RealmConfig[] = []

export const realmsFor = (
  region: RegionCode,
  realms: readonly RealmConfig[] = REALMS,
) => realms.filter((r) => r.region === region)

export const findRealm = (
  region: RegionCode,
  slug: string,
  realms: readonly RealmConfig[] = REALMS,
) => realms.find((r) => r.region === region && r.slug === slug)
