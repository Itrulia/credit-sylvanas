import { describe, expect, it } from 'vitest'
import { withSecurityHeaders } from './security-headers.ts'

describe('withSecurityHeaders', () => {
  it('adds the security headers and keeps status, body and existing headers', async () => {
    const res = withSecurityHeaders(
      new Response('hi', {
        status: 404,
        headers: { 'Cache-Control': 'public', 'Content-Type': 'text/html' },
      }),
    )
    expect(res.status).toBe(404)
    expect(await res.text()).toBe('hi')
    expect(res.headers.get('Cache-Control')).toBe('public')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin',
    )
    expect(res.headers.get('Permissions-Policy')).toContain('camera=()')
    expect(res.headers.get('Strict-Transport-Security')).toMatch(/max-age=\d+/)
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    expect(res.headers.get('Content-Security-Policy')).toContain(
      "frame-ancestors 'none'",
    )
    const reportOnly = res.headers.get('Content-Security-Policy-Report-Only')!
    expect(reportOnly).toContain('https://wow.zamimg.com')
    expect(reportOnly).toContain('https://cloud.umami.is')
  })

  it('works on immutable responses such as cache hits and redirects', () => {
    const res = withSecurityHeaders(
      Response.redirect('https://site.test/', 301),
    )
    expect(res.status).toBe(301)
    expect(res.headers.get('Location')).toBe('https://site.test/')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })
})
