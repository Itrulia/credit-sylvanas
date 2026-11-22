import { expect, it } from 'vitest'
import { Region } from '#/lib/search'
import {
  DISABLED_REGIONS,
  REGIONS,
  REGION_INFO,
  isRegion,
  regionLabel,
} from './regions'

it('offers EU then NA, and lists KR and TW as switched off', () => {
  expect(REGIONS).toEqual(['eu', 'us'])
  expect(REGION_INFO.us.name).toBe('NA')
  expect(DISABLED_REGIONS.map((r) => r.name)).toEqual(['KR', 'TW'])
  expect(isRegion('kr')).toBe(false)
  expect(isRegion('tw')).toBe(false)
  expect(Region.safeParse('kr').success).toBe(false)
})

it('labels a region code for page copy, NA for us', () => {
  expect(regionLabel('us')).toBe('NA')
  expect(regionLabel('eu')).toBe('EU')
  expect(regionLabel('xx')).toBe('XX')
})
