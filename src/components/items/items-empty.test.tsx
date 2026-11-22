// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import type { HotRow } from '#/server/types'
import { ItemsEmpty } from './items-empty'
import { renderAtItems } from './test-router'

afterEach(cleanup)

const hot = (id: number, name: string): HotRow => ({
  id,
  name,
  mv: 100,
  hist: 100,
  asp: 100,
  saleRate: 0.5,
  spd: 10,
  goldVolume: 1000,
  vsHist: 0,
  d1: null,
})
const popular = [hot(1, 'Arcanite Bar'), hot(2, 'Runecloth')]

it('no results: names the query and region, then the most sold items', async () => {
  renderAtItems(
    <ItemsEmpty region="us" q="zzz" page={1} total={0} popular={popular} />,
  )
  expect(
    await screen.findByRole('heading', {
      name: 'No items match "zzz" in NA.',
    }),
  ).toBeTruthy()
  expect(screen.getByText(/Check the spelling/)).toBeTruthy()
  expect(
    screen.getByRole('heading', { name: 'Most sold right now' }),
  ).toBeTruthy()
  expect(
    screen.getByRole('link', { name: 'Arcanite Bar' }).getAttribute('href'),
  ).toBe('/us/items/1')
  expect(screen.getByRole('link', { name: 'Runecloth' })).toBeTruthy()
})

it('numeric miss: names the id and links to Wowhead', async () => {
  renderAtItems(<ItemsEmpty region="eu" q="12345" page={1} total={0} />)
  expect(
    await screen.findByRole('heading', { name: 'No item #12345 in EU.' }),
  ).toBeTruthy()
  const link = screen.getByRole('link', { name: /Look it up on Wowhead/ })
  expect(link.getAttribute('href')).toBe(
    'https://www.wowhead.com/forever/item=12345',
  )
  expect(screen.queryByText('Most sold right now')).toBeNull()
})

it('page past end: says so and links back to page 1, keeping q and sort', async () => {
  renderAtItems(
    <ItemsEmpty region="us" q="bar" page={9} total={60} popular={popular} />,
    '/us/items?q=bar&sort=name&page=9',
  )
  expect(
    await screen.findByRole('heading', { name: 'There is no page 9.' }),
  ).toBeTruthy()
  expect(
    screen.getByText(/60 items matching "bar" fit on 2 pages/),
  ).toBeTruthy()
  const back = screen.getByRole('link', { name: 'Back to page 1' })
  expect(back.getAttribute('href')).toBe('/us/items?q=bar&sort=name')
  expect(screen.getByRole('link', { name: 'Arcanite Bar' })).toBeTruthy()
})
