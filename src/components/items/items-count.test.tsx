// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ItemsCount } from './items-count'

afterEach(cleanup)

it('counts items with plurals', () => {
  const { rerender } = render(<ItemsCount total={4812} q="" busy={false} />)
  expect(screen.getByRole('status').textContent).toBe('4,812 items')
  rerender(<ItemsCount total={1} q="" busy={false} />)
  expect(screen.getByRole('status').textContent).toBe('1 item')
  rerender(<ItemsCount total={3} q="bar" busy={false} />)
  expect(screen.getByRole('status').textContent).toBe('3 items matching "bar"')
})

it('announces once per settled query: holds the last settled count while busy', () => {
  const { rerender } = render(<ItemsCount total={10} q="ba" busy={false} />)
  const status = screen.getByRole('status')
  expect(status.getAttribute('aria-live')).toBe('polite')
  rerender(<ItemsCount total={10} q="bar" busy />)
  rerender(<ItemsCount total={10} q="barr" busy />)
  expect(status.textContent).toBe('10 items matching "ba"')
  rerender(<ItemsCount total={2} q="barr" busy={false} />)
  expect(status.textContent).toBe('2 items matching "barr"')
})
