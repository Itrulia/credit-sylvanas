import { describe, expect, it } from 'vitest'
import { BINS, binFill, binInk, binOf } from './bins'

describe('binOf', () => {
  it('bins at +-2/5/15/35%', () => {
    expect(binOf(null)).toBeNull()
    expect(binOf(Number.NaN)).toBeNull()
    expect(binOf(0)).toBe(0)
    expect(binOf(0.0199)).toBe(0)
    expect(binOf(-0.0199)).toBe(0)
    expect(binOf(0.02)).toBe(1)
    expect(binOf(-0.05)).toBe(-2)
    expect(binOf(0.149)).toBe(2)
    expect(binOf(0.15)).toBe(3)
    expect(binOf(-0.35)).toBe(-4)
    expect(binOf(9)).toBe(4)
  })

  it('maps to div tokens', () => {
    expect(binFill(-4)).toBe('var(--div-n4)')
    expect(binFill(0)).toBe('var(--div-0)')
    expect(binFill(3)).toBe('var(--div-p3)')
  })
})

describe('binInk', () => {
  it('covers all 9 bins', () => {
    expect(BINS.map((b) => binInk(b))).toEqual([
      '--card',
      '--card',
      '--foreground',
      '--foreground',
      '--foreground',
      '--foreground',
      '--foreground',
      '--card',
      '--card',
    ])
    expect(binInk(null)).toBe('--foreground')
  })
})
