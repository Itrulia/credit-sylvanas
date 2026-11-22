import { describe, expect, it } from 'vitest'
import { plural } from './plural'

describe('plural', () => {
  const forms = { one: 'item', other: 'items' }

  it('picks the CLDR category for the locale', () => {
    expect(plural(1, forms)).toBe('item')
    expect(plural(0, forms)).toBe('items')
    expect(plural(2, forms)).toBe('items')
    expect(plural(4812, forms)).toBe('items')
  })

  it('uses zero only when given and n is exactly 0', () => {
    expect(plural(0, { ...forms, zero: 'none' })).toBe('none')
    expect(plural(1, { ...forms, zero: 'none' })).toBe('item')
  })
})
