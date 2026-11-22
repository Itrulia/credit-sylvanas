// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, screen, within } from '@testing-library/react'
import { MomentumGrid } from './momentum-grid'
import { heatRow, renderInRouter } from './test-utils'

afterEach(cleanup)

it('lists tiles pricier first, a missing average last as a hatch tile', async () => {
  renderInRouter(
    <MomentumGrid
      region="us"
      rows={[
        heatRow(1, 'Arcanite Bar', { vsHist: null }),
        heatRow(2, 'Black Lotus', { vsHist: -0.2 }),
        heatRow(3, 'Copper Ore', { vsHist: 0.4 }),
      ]}
    />,
  )
  const tiles = within(await screen.findByRole('figure')).getAllByRole(
    'listitem',
  )
  expect(tiles.map((li) => li.querySelector('a')?.textContent)).toEqual([
    'Copper Ore',
    'Black Lotus',
    'Arcanite Bar',
  ])
  expect(tiles[2].className).toContain('hatch')
  expect(tiles[0].getAttribute('style')).toContain('--div-p4')
  expect(tiles[0].textContent).toContain('40.0 percent above 60-day average')
  expect(
    screen.getByText(
      '3 items: 1 pricier than usual, 1 cheaper, 0 about usual, 1 without a 60-day average.',
    ),
  ).toBeTruthy()
})
