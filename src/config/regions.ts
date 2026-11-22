export const REGIONS = ['us', 'eu', 'kr', 'tw'] as const
export type RegionCode = (typeof REGIONS)[number]

export const REGION_INFO: Record<
  RegionCode,
  { code: RegionCode; name: string; fullName: string }
> = {
  us: { code: 'us', name: 'US', fullName: 'Americas & Oceania' },
  eu: { code: 'eu', name: 'EU', fullName: 'Europe' },
  kr: { code: 'kr', name: 'KR', fullName: 'Korea' },
  tw: { code: 'tw', name: 'TW', fullName: 'Taiwan' },
}

export const isRegion = (value: string): value is RegionCode =>
  (REGIONS as readonly string[]).includes(value)
