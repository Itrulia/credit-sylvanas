// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FavouriteButton } from './favourite-button'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('FavouriteButton', () => {
  it('toggles the favourite and its pressed state', () => {
    render(<FavouriteButton region="eu" itemId={12360} name="Arcanite Bar" />)
    const button = screen.getByRole('button', { name: 'Favourite' })
    expect(button.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(JSON.parse(localStorage.getItem('favourite-items')!)).toEqual([
      { region: 'eu', itemId: 12360, name: 'Arcanite Bar' },
    ])
    fireEvent.click(button)
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(JSON.parse(localStorage.getItem('favourite-items')!)).toEqual([])
  })

  it('shows a stored favourite as pressed', () => {
    localStorage.setItem(
      'favourite-items',
      JSON.stringify([{ region: 'eu', itemId: 12360, name: 'Arcanite Bar' }]),
    )
    render(<FavouriteButton region="eu" itemId={12360} name="Arcanite Bar" />)
    expect(
      screen
        .getByRole('button', { name: 'Favourite' })
        .getAttribute('aria-pressed'),
    ).toBe('true')
  })
})
