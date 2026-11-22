// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import { DailyChangeTable } from './daily-change-table'
import { DailyChangeSkeleton } from './daily-change-skeleton'
import { renderInRouter } from './test-utils'

afterEach(cleanup)

// 20,000 is 4 Oct 2024 (UTC)
it('says when daily changes start while there is under a week of data', async () => {
  renderInRouter(
    <DailyChangeTable
      region="eu"
      data={{ available: false, days: 1, from: 20_006 }}
    />,
  )
  expect(
    await screen.findByText('Daily changes start on 10 Oct 2024.'),
  ).toBeTruthy()
  expect(
    screen.getByText(/We've saved 1 of 7 daily updates for EU/),
  ).toBeTruthy()
  expect(screen.queryByRole('table')).toBeNull()
})

it('prints a compact signed change per day with dated columns', async () => {
  renderInRouter(
    <DailyChangeTable
      region="us"
      data={{
        available: true,
        cols: [20_000, 20_001],
        rows: [{ id: 7, name: 'Copper Ore', d1: [0.2, null] }],
      }}
    />,
  )
  const time = await screen.findByText('4 Oct')
  expect(time.tagName).toBe('TIME')
  expect(time.getAttribute('datetime')).toBe('2024-10-04')
  const row = screen
    .getByRole('rowheader', { name: 'Copper Ore' })
    .closest('tr')!
  const [rose, missing] = within(row).getAllByRole('cell')
  expect(rose.textContent).toContain('+20')
  expect(rose.textContent).toContain('up 20.0 percent')
  expect(rose.getAttribute('style')).toContain('--div-p3')
  expect(missing.className).toContain('hatch')
})

it('reserves the final table size while loading', () => {
  const { container } = renderInRouter(<DailyChangeSkeleton n={10} />)
  return screen.findByText('Loading daily changes…').then(() => {
    const box = container.querySelector('[aria-busy="true"]') as HTMLElement
    expect(box.style.height).toBe(`${10 * 30 + 40}px`)
  })
})
