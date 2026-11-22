// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import type { ListRow } from '#/server/types'
import { ItemsTable, nextSort } from './items-table'
import { renderAtItems } from './test-router'

afterEach(cleanup)

const row: ListRow = {
  id: 12360,
  name: 'Arcanite Bar',
  mv: 123456,
  hist: 100000,
  vsHist: 0.23456,
  asp: 120000,
  saleRate: 0.25,
  spd: 42.5,
}

// header text minus the trailing sort icon ligature
const headerTexts = async () =>
  (await screen.findAllByRole('columnheader')).map((h) =>
    h.textContent.replace(/(unfold_more|arrow_upward|arrow_downward)$/, ''),
  )

describe('nextSort', () => {
  it('flips the direction on the active column', () => {
    expect(nextSort({ sort: 'soldPerDay', dir: 'desc' }, 'soldPerDay')).toEqual(
      { sort: 'soldPerDay', dir: 'asc' },
    )
    expect(nextSort({ sort: 'name', dir: 'asc' }, 'name')).toEqual({
      sort: 'name',
      dir: 'desc',
    })
  })
  it('starts a new column high to low, and names A to Z', () => {
    expect(nextSort({ sort: 'name', dir: 'asc' }, 'marketValue')).toEqual({
      sort: 'marketValue',
      dir: 'desc',
    })
    expect(nextSort({ sort: 'marketValue', dir: 'desc' }, 'name')).toEqual({
      sort: 'name',
      dir: 'asc',
    })
  })
})

it('renders the region columns with aria-sort and calls onSort', async () => {
  const onSort = vi.fn()
  renderAtItems(
    <ItemsTable
      region="us"
      rows={[row]}
      sort="soldPerDay"
      dir="desc"
      onSort={onSort}
      busy={false}
    />,
  )
  expect(await headerTexts()).toEqual([
    'Item',
    'Market value',
    '60-day avg',
    'vs avg',
    'Avg sale',
    'Sold/day',
    'Sale rate',
  ])
  expect(
    screen
      .getByRole('columnheader', { name: /Sold\/day/ })
      .getAttribute('aria-sort'),
  ).toBe('descending')
  expect(
    screen.getByRole('link', { name: 'Arcanite Bar' }).getAttribute('href'),
  ).toBe('/us/items/12360')
  expect(
    screen
      .getByRole('link', {
        name: 'View Arcanite Bar on Wowhead (opens Wowhead)',
      })
      .getAttribute('href'),
  ).toBe('https://www.wowhead.com/forever/item=12360')
  expect(screen.getByText('25%')).toBeTruthy()
  expect(screen.getByText('42.5')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /Market value/ }))
  expect(onSort).toHaveBeenCalledWith('marketValue')
})

it('adds realm market value and lowest buyout after market value', async () => {
  renderAtItems(
    <ItemsTable
      region="us"
      rows={[{ ...row, realmMv: 130000, minBuyout: 0 }]}
      sort="soldPerDay"
      dir="desc"
      onSort={() => {}}
      busy={false}
      withRealm
    />,
  )
  expect((await headerTexts()).slice(0, 4)).toEqual([
    'Item',
    'Market value',
    'Realm market value',
    'Lowest buyout',
  ])
  expect(screen.getByText('No listings')).toBeTruthy()
})

it('dims the old rows with aria-busy while loading', async () => {
  renderAtItems(
    <ItemsTable
      region="us"
      rows={[row]}
      sort="name"
      dir="asc"
      onSort={() => {}}
      busy
    />,
  )
  expect((await screen.findByRole('region')).getAttribute('aria-busy')).toBe(
    'true',
  )
})
