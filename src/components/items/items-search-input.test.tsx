// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ItemsSearchInput } from './items-search-input'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

it('has a visible label and calls onSearch once, 250ms after typing stops', () => {
  const onSearch = vi.fn()
  render(<ItemsSearchInput q="" onSearch={onSearch} />)
  const input = screen.getByLabelText('Search items')
  expect(input.getAttribute('placeholder')).toBe(
    'Item name or ID, e.g. Arcanite Bar',
  )
  fireEvent.change(input, { target: { value: 'arc' } })
  act(() => vi.advanceTimersByTime(100))
  fireEvent.change(input, { target: { value: 'arcanite ' } })
  act(() => vi.advanceTimersByTime(249))
  expect(onSearch).not.toHaveBeenCalled()
  act(() => vi.advanceTimersByTime(1))
  expect(onSearch).toHaveBeenCalledTimes(1)
  expect(onSearch).toHaveBeenCalledWith('arcanite')
})

it('follows q from the URL (back button) without clobbering a trailing space', () => {
  const onSearch = vi.fn()
  const { rerender } = render(<ItemsSearchInput q="" onSearch={onSearch} />)
  const input = screen.getByLabelText<HTMLInputElement>('Search items')
  fireEvent.change(input, { target: { value: 'arcanite ' } })
  rerender(<ItemsSearchInput q="arcanite" onSearch={onSearch} />)
  expect(input.value).toBe('arcanite ')
  rerender(<ItemsSearchInput q="runecloth" onSearch={onSearch} />)
  expect(input.value).toBe('runecloth')
})
