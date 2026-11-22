import { describe, expect, it } from 'vitest'
import { wwwRedirect } from './www-redirect.ts'

describe('wwwRedirect', () => {
  it('sends www to the apex with a 301, keeping path and query', () => {
    const res = wwwRedirect(
      new Request('https://www.credit-sylvanas.app/us/items?q=linen'),
    )
    expect(res?.status).toBe(301)
    expect(res?.headers.get('Location')).toBe(
      'https://credit-sylvanas.app/us/items?q=linen',
    )
  })

  it('leaves the apex and other hosts alone', () => {
    expect(wwwRedirect(new Request('https://credit-sylvanas.app/'))).toBeNull()
    expect(wwwRedirect(new Request('http://localhost:3000/'))).toBeNull()
  })
})
