import { expect, it } from 'vitest'
import { itemName, wowheadData, wowheadItemUrl } from './wowhead'

it('builds Forever links and a fallback name', () => {
  expect(wowheadItemUrl(2589)).toBe('https://www.wowhead.com/forever/item=2589')
  expect(wowheadData(2589)).toBe('item=2589&domain=forever')
  expect(itemName('', 7)).toBe('Item #7')
  expect(itemName('Linen Cloth', 2589)).toBe('Linen Cloth')
})
