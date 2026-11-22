// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { Delta } from './delta'

afterEach(cleanup)

const sr = (el: HTMLElement) => el.querySelector('.sr-only')?.textContent

describe('Delta', () => {
  it('shows glyph, signed number and sr text in the muted direction colours', () => {
    const up = render(<Delta value={0.124} />).container
    expect(up.textContent).toContain('▲+12.4%')
    expect(sr(up)).toBe('up 12.4 percent')
    expect(up.firstElementChild?.className).toContain('text-up')
    cleanup()
    const down = render(<Delta value={-0.081} mode="vsHist" />).container
    expect(down.textContent).toContain('▼−8.1%')
    expect(sr(down)).toBe('8.1 percent below 60-day average')
    expect(down.firstElementChild?.className).toContain('text-down')
  })

  it('treats +-0.5% as flat', () => {
    const { container } = render(<Delta value={0.004} mode="vsMedian" />)
    expect(container.textContent).toContain('≈0.0%')
    expect(sr(container)).toBe('about the same as the cross-region median')
  })

  it('names the reference it was given', () => {
    const { container } = render(
      <Delta value={0.2} mode="vsMedian" reference="the 30-day median" />,
    )
    expect(sr(container)).toBe('20.0 percent above the 30-day median')
  })

  it('drops glyph and decimal in compact mode', () => {
    const { container } = render(<Delta value={-0.034} compact />)
    expect(container.textContent).toBe('−3down 3.4 percent')
  })

  it('never fakes 0% for null', () => {
    const { container } = render(<Delta value={null} />)
    expect(sr(container)).toBe('Not enough history yet')
  })
})
