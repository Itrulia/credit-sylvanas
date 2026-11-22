import { expect, it } from 'vitest'
import { median } from './median'

it('computes the median', () => {
  expect(median([])).toBeNull()
  expect(median([3])).toBe(3)
  expect(median([5, 1, 3])).toBe(3)
  expect(median([4, 1, 3, 2])).toBe(2.5)
})
