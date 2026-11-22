// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CrossRegionTable } from './cross-region-table'
import { heatRow, renderInRouter } from './test-utils'

afterEach(cleanup)

const rows = [
  heatRow(1, 'Arcanite Bar', { spread: null, goldVolume: 300 }),
  heatRow(2, 'Black Lotus', { spread: 0.1, goldVolume: 200 }),
  heatRow(3, 'Copper Ore', { spread: 0.9, goldVolume: 100 }),
]

const base = {
  region: 'us' as const,
  rows,
  regionsWithData: ['us', 'eu', 'kr'] as const,
  n: 25 as const,
  sort: 'volume' as const,
  metric: 'index' as const,
  onSort: () => {},
}

const rowNames = () =>
  screen.getAllByRole('rowheader').map((th) => th.textContent)

describe('CrossRegionTable', () => {
  it('shows the one-region panel when only one region has prices', async () => {
    renderInRouter(<CrossRegionTable {...base} regionsWithData={['us']} />)
    expect(
      await screen.findByText('Cross-region comparison needs two regions.'),
    ).toBeTruthy()
    expect(screen.getByText(/Only US has prices so far/)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('hatches a missing cell and a region with no data', async () => {
    renderInRouter(<CrossRegionTable {...base} />)
    const first = (
      await screen.findByRole('rowheader', { name: 'Arcanite Bar' })
    ).closest('tr')!
    const cells = within(first).getAllByRole('cell')
    // KR has data but not this item; TW has no data at all
    expect(cells[2].className).toContain('hatch')
    expect(cells[2].textContent).toContain('Not listed in KR')
    expect(cells[3].textContent).toContain('No TW prices yet')
    const headers = screen
      .getAllByRole('columnheader')
      .map((th) => th.textContent)
    expect(headers).toContain('US (this region)')
    expect(headers).toContain('TW (no data yet)')
    expect(headers).toContain('KR')
  })

  it('sorts by spread with nulls last and marks aria-sort', async () => {
    renderInRouter(<CrossRegionTable {...base} sort="spread" />)
    await screen.findByRole('table')
    expect(rowNames()).toEqual(['Copper Ore', 'Black Lotus', 'Arcanite Bar'])
    const spread = screen.getByRole('columnheader', { name: /Spread/ })
    expect(spread.getAttribute('aria-sort')).toBe('descending')
    expect(
      screen
        .getByRole('columnheader', { name: /Item/ })
        .getAttribute('aria-sort'),
    ).toBe('none')
  })

  it('reports the next sort and announces it politely', async () => {
    const onSort = vi.fn()
    renderInRouter(<CrossRegionTable {...base} sort="name" onSort={onSort} />)
    await screen.findByRole('table')
    expect(rowNames()).toEqual(['Arcanite Bar', 'Black Lotus', 'Copper Ore'])
    await userEvent.click(screen.getByRole('button', { name: /Item/ }))
    expect(onSort).toHaveBeenCalledWith('volume')
    expect(screen.getByRole('status').textContent).toBe(
      'Sorted by gold traded per day, highest first.',
    )
  })

  it('prints prices in price mode, coloured by the index', async () => {
    renderInRouter(<CrossRegionTable {...base} metric="price" />)
    const first = (
      await screen.findByRole('rowheader', { name: 'Arcanite Bar' })
    ).closest('tr')!
    const us = within(first).getAllByRole('cell')[0]
    expect(us.textContent).toContain('1g')
    expect(us.getAttribute('style')).toContain('--div-p2')
  })

  it('never makes cells focusable or a grid', async () => {
    const { container } = renderInRouter(<CrossRegionTable {...base} />)
    await screen.findByRole('table')
    expect(container.querySelector('[role="grid"]')).toBeNull()
    expect(container.querySelector('td[tabindex], th[tabindex]')).toBeNull()
  })
})
