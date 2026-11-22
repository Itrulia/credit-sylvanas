import { describe, expect, it } from 'vitest'
import { formatMoney, moneyLabel, moneyText } from './money'

const text = (c: number, v: 'full' | 'compact' | 'axis') =>
  moneyText(formatMoney(c, v))

describe('formatMoney full', () => {
  it('shows every non-zero unit, padded after a higher unit', () => {
    expect(text(12_340_507, 'full')).toBe('1,234g 05s 07c')
    expect(text(10_005, 'full')).toBe('1g 05c')
    expect(text(507, 'full')).toBe('5s 07c')
    expect(text(7, 'full')).toBe('7c')
    expect(text(0, 'full')).toBe('0c')
    expect(text(10_000, 'full')).toBe('1g')
  })
})

describe('formatMoney compact', () => {
  it('shows gold only from 1000g, rounding half-up', () => {
    expect(text(123_455_000, 'compact')).toBe('12,346g')
    expect(text(123_454_999, 'compact')).toBe('12,345g')
  })
  it('shows g and s from 1g', () => {
    expect(text(12_345, 'compact')).toBe('1g 23s')
    expect(text(12_350, 'compact')).toBe('1g 24s')
    expect(text(10_000, 'compact')).toBe('1g 00s')
    expect(text(9_999_960, 'compact')).toBe('1,000g')
    expect(text(9_995_000, 'compact')).toBe('999g 50s')
  })
  it('shows s and c below 1g', () => {
    expect(text(4_005, 'compact')).toBe('40s 05c')
    expect(text(5, 'compact')).toBe('5c')
  })
})

describe('formatMoney axis', () => {
  it('uses the largest unit with 3 significant digits and k from 10,000g', () => {
    expect(text(12_000 * 10_000, 'axis')).toBe('12kg')
    expect(text(12_345 * 10_000, 'axis')).toBe('12.3kg')
    expect(text(850 * 10_000, 'axis')).toBe('850g')
    expect(text(1_234 * 10_000, 'axis')).toBe('1,230g')
    expect(text(4_000, 'axis')).toBe('40s')
    expect(text(37, 'axis')).toBe('37c')
    expect(text(0, 'axis')).toBe('0c')
  })
})

describe('moneyLabel', () => {
  it('spells out the exact value', () => {
    expect(moneyLabel(12_340_507)).toBe('1234 gold 5 silver 7 copper')
    expect(moneyLabel(0)).toBe('0 copper')
    expect(moneyLabel(10_000)).toBe('1 gold')
  })
})
