// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useRegion } from './site-commands'

const params = vi.hoisted(() => ({ region: undefined as string | undefined }))
vi.mock('@tanstack/react-router', () => ({
  useParams: () => params,
  useNavigate: () => vi.fn(),
}))

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('useRegion', () => {
  it('is US with no region in the URL and nothing remembered', () => {
    params.region = undefined
    expect(renderHook(() => useRegion()).result.current).toBe('us')
  })

  it('remembers the URL region for pages without one', () => {
    params.region = 'eu'
    const onRegion = renderHook(() => useRegion())
    expect(onRegion.result.current).toBe('eu')
    onRegion.unmount()
    params.region = undefined
    const onAbout = renderHook(() => useRegion())
    expect(onAbout.result.current).toBe('eu')
  })

  it('updates open pages when another region is visited', () => {
    params.region = undefined
    const { result } = renderHook(() => useRegion())
    params.region = 'eu'
    act(() => {
      renderHook(() => useRegion())
    })
    expect(result.current).toBe('eu')
  })
})
