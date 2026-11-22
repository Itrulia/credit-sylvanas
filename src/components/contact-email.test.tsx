// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ContactEmail } from './contact-email'

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
})

it('says contact details are pending while VITE_CONTACT_EMAIL is empty', () => {
  vi.stubEnv('VITE_CONTACT_EMAIL', '')
  render(<ContactEmail />)
  expect(screen.getByText(/haven't published a contact address/i)).toBeTruthy()
  expect(screen.queryByRole('link')).toBeNull()
})

it('links the address once it is set', () => {
  vi.stubEnv('VITE_CONTACT_EMAIL', 'hello@example.org')
  render(<ContactEmail />)
  expect(
    screen
      .getByRole('link', { name: 'hello@example.org' })
      .getAttribute('href'),
  ).toBe('mailto:hello@example.org')
})
