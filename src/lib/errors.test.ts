import { expect, it } from 'vitest'
import { noDataError, noDataRegion } from './errors'

it('marks and recognises the no-data error, also after serialisation', () => {
  expect(noDataRegion(noDataError('eu'))).toBe('eu')
  expect(noDataRegion({ message: 'NO_DATA:us' })).toBe('us')
  expect(noDataRegion(new Error('boom'))).toBeNull()
  expect(noDataRegion(null)).toBeNull()
})
