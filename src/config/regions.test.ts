import { expect, it } from 'vitest'
import { Region } from '#/lib/search'
import { REGIONS, isRegion } from './regions'

it('offers only US and EU while KR and TW are switched off', () => {
  expect(REGIONS).toEqual(['us', 'eu'])
  expect(isRegion('kr')).toBe(false)
  expect(isRegion('tw')).toBe(false)
  expect(Region.safeParse('kr').success).toBe(false)
})
