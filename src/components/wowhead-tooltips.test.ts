// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WOWHEAD_SCRIPT } from '#/lib/wowhead'
import { loadWowheadScript, setIconsOff } from './wowhead-tooltips'

const state = () => document.documentElement.dataset.wowhead

afterEach(() => {
  vi.useRealTimers()
  document.head.innerHTML = ''
  setIconsOff(false)
  delete window.WH
})

describe('loadWowheadScript', () => {
  it('drops the reserved icon boxes when the script fails to load', () => {
    loadWowheadScript()
    const script = document.querySelector<HTMLScriptElement>(
      `script[src="${WOWHEAD_SCRIPT}"]`,
    )!
    expect(state()).toBeUndefined()
    script.dispatchEvent(new Event('error'))
    expect(state()).toBe('off')
  })

  it('drops them when window.WH never appears before the timeout', () => {
    vi.useFakeTimers()
    loadWowheadScript(5000)
    vi.advanceTimersByTime(4999)
    expect(state()).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(state()).toBe('off')
  })

  it('keeps them once the script has defined window.WH', () => {
    vi.useFakeTimers()
    loadWowheadScript(5000)
    window.WH = {}
    vi.advanceTimersByTime(5000)
    expect(state()).toBeUndefined()
  })
})
