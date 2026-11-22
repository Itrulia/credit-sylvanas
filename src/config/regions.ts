// KR and TW are switched off for now. The D1 schema still accepts them, so
// adding them back here (with their REGION_INFO) turns them on everywhere.
export const REGIONS = ['us', 'eu'] as const
export type RegionCode = (typeof REGIONS)[number]

export const REGION_INFO: Record<
  RegionCode,
  { code: RegionCode; name: string; fullName: string }
> = {
  us: { code: 'us', name: 'US', fullName: 'Americas & Oceania' },
  eu: { code: 'eu', name: 'EU', fullName: 'Europe' },
}

export const isRegion = (value: string): value is RegionCode =>
  (REGIONS as readonly string[]).includes(value)
