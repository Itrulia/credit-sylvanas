// Enabled regions, in display order. The code stays 'us' (TSM's file name and
// the D1 value) while the label says NA.
export const REGIONS = ['eu', 'us'] as const
export type RegionCode = (typeof REGIONS)[number]

export const REGION_INFO: Record<
  RegionCode,
  { code: RegionCode; name: string; fullName: string }
> = {
  eu: { code: 'eu', name: 'EU', fullName: 'Europe' },
  us: { code: 'us', name: 'NA', fullName: 'Americas & Oceania' },
}

export const isRegion = (value: string): value is RegionCode =>
  (REGIONS as readonly string[]).includes(value)

// Shown greyed out in the nav and on the home page, never routed or ingested.
// The D1 schema still accepts kr and tw: moving one into REGIONS (with its
// REGION_INFO) turns it on.
export const DISABLED_REGIONS = [
  { code: 'kr', name: 'KR', fullName: 'Korea' },
  { code: 'tw', name: 'TW', fullName: 'Taiwan' },
] as const
