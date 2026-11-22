// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, screen } from '@testing-library/react'
import { Pager } from './pager'
import { renderAtItems } from './test-router'

afterEach(cleanup)

it('first page: shows the range, Prev is disabled and Next keeps the search', async () => {
  renderAtItems(<Pager page={1} total={4812} />, '/us/items?q=bar')
  expect(await screen.findByText('Showing 1–50 of 4,812')).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Previous page/ })).toBeNull()
  expect(
    screen.getByText('Previous page').closest('[aria-disabled="true"]'),
  ).toBeTruthy()
  expect(
    screen.getByRole('link', { name: /Next page/ }).getAttribute('href'),
  ).toBe('/us/items?q=bar&page=2')
})

it('last page: Prev to page 1 drops the default page param, Next is disabled', async () => {
  renderAtItems(<Pager page={2} total={60} />, '/us/items?page=2')
  expect(await screen.findByText('Showing 51–60 of 60')).toBeTruthy()
  expect(
    screen.getByRole('link', { name: /Previous page/ }).getAttribute('href'),
  ).toBe('/us/items')
  expect(screen.queryByRole('link', { name: /Next page/ })).toBeNull()
})

it('renders nothing when everything fits on one page', async () => {
  const { container } = renderAtItems(
    <>
      <p>table</p>
      <Pager page={1} total={50} />
    </>,
  )
  await screen.findByText('table')
  expect(container.querySelector('nav')).toBeNull()
})
