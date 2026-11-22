import { notFound, redirect } from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'
import { hideServerError, noDataError, noDataRegion } from './errors'

it('marks and recognises the no-data error, also after serialisation', () => {
  expect(noDataRegion(noDataError('eu'))).toBe('eu')
  expect(noDataRegion({ message: 'NO_DATA:us' })).toBe('us')
  expect(noDataRegion(new Error('boom'))).toBeNull()
  expect(noDataRegion(null)).toBeNull()
})

describe('hideServerError', () => {
  it('logs the real error and returns one without its text', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const raw = new Error('no such table: imports: SQLITE_ERROR')
    const hidden = hideServerError(raw)
    expect(log).toHaveBeenCalledWith(raw)
    expect(hidden).toBeInstanceOf(Error)
    expect(
      JSON.stringify(hidden, Object.getOwnPropertyNames(hidden)),
    ).not.toMatch(/SQLITE|no such table/)
    log.mockRestore()
  })

  it('passes redirects, not-founds and the no-data marker through', () => {
    const r = redirect({ href: '/eu' })
    const n = notFound()
    const d = noDataError('eu')
    expect(hideServerError(r)).toBe(r)
    expect(hideServerError(n)).toBe(n)
    expect(hideServerError(d)).toBe(d)
  })
})
