import { describe, expect, it } from 'vitest'
import { columns } from './hottest-table'

// which columns phones hide (md:table-cell); jsdom can't evaluate media queries
const hiddenOnPhones = (hot: 'gold' | 'traded') =>
  columns('us', hot, true)
    .filter((c) => c.meta?.cellClassName === 'hidden md:table-cell')
    .map((c) => c.id)

describe('Hottest columns on phones', () => {
  it('keep the column the list is ranked by', () => {
    expect(hiddenOnPhones('gold')).toEqual(['spd'])
    expect(hiddenOnPhones('traded')).toEqual(['goldVolume'])
  })
})
