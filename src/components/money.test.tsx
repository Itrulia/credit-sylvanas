// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Money } from './money'

afterEach(cleanup)

describe('Money', () => {
  it('labels the exact value and hides the letters from screen readers', () => {
    const { container } = render(<Money copper={12_340_507} />)
    const data = container.querySelector('data')!
    expect(data.getAttribute('value')).toBe('12340507')
    expect(data.getAttribute('aria-label')).toBe('1234 gold 5 silver 7 copper')
    expect(data.textContent).toBe('1,234g05s07c')
  })

  it('keeps three slots when aligned', () => {
    const { container } = render(<Money copper={507} align />)
    expect(container.querySelector('data')!.children).toHaveLength(3)
  })

  it('renders a dash with a reason for null', () => {
    const { container } = render(
      <Money copper={null} reason="No recent sales" />,
    )
    expect(container.textContent).toBe('—No recent sales')
    expect(container.querySelector('.sr-only')?.textContent).toBe(
      'No recent sales',
    )
  })
})
