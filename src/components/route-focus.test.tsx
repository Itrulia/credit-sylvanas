// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { focusNewPage } from './route-focus'

afterEach(() => {
  document.body.innerHTML = ''
})

const nav = (pathChanged: boolean, first = false) => ({
  fromLocation: first ? undefined : ({} as never),
  pathChanged,
})

describe('focusNewPage', () => {
  it('moves focus to the page h1 after a client navigation to a new path', () => {
    document.body.innerHTML =
      '<button>palette</button><main id="main" tabindex="-1"><h1>EU items</h1></main>'
    document.querySelector('button')!.focus()
    focusNewPage(nav(true))
    const h1 = document.querySelector('h1')!
    expect(document.activeElement).toBe(h1)
    expect(h1.getAttribute('tabindex')).toBe('-1')
  })

  it('falls back to main when the page has no h1', () => {
    document.body.innerHTML = '<main id="main" tabindex="-1"><p>x</p></main>'
    focusNewPage(nav(true))
    expect(document.activeElement?.id).toBe('main')
  })

  it('leaves focus alone on the first load and on search-only changes', () => {
    document.body.innerHTML =
      '<button>sort</button><main id="main" tabindex="-1"><h1>Items</h1></main>'
    const button = document.querySelector('button')!
    button.focus()
    focusNewPage(nav(true, true))
    focusNewPage(nav(false))
    expect(document.activeElement).toBe(button)
  })
})
