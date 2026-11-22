// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  readLastRegion,
  rememberRegion,
  subscribeLastRegion,
} from './last-region'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('last region', () => {
  it('remembers the region and tells subscribers once per change', () => {
    const listener = vi.fn()
    const off = subscribeLastRegion(listener)
    expect(readLastRegion()).toBeNull()
    rememberRegion('eu')
    rememberRegion('eu')
    expect(readLastRegion()).toBe('eu')
    expect(listener).toHaveBeenCalledTimes(1)
    off()
  })

  it('ignores junk and works without storage', () => {
    localStorage.setItem('last-region', 'xx')
    expect(readLastRegion()).toBeNull()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readLastRegion()).toBeNull()
    expect(() => rememberRegion('us')).not.toThrow()
  })
})
