// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import type { RealmConfig } from '#/config/realms'
import type { RealmsFilter } from './realm-list'
import { RealmList } from './realm-list'

afterEach(cleanup)

const REALMS: RealmConfig[] = [
  { region: 'us', slug: 'gilneas', name: 'Gilneas', ruleset: 'pvp' },
  { region: 'us', slug: 'moonglade', name: 'Moonglade', ruleset: 'rp' },
]

function setup(realms: readonly RealmConfig[], ruleset: RealmsFilter = 'all') {
  const root = createRootRoute({
    component: () => (
      <RealmList region="us" realms={realms} ruleset={ruleset} />
    ),
  })
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ['/us/realms'] }),
  })
  render(<RouterProvider router={router} />)
}

it('shows the shipped empty state with a link to the market', async () => {
  setup([])
  expect(await screen.findByText('No realms on the books yet.')).toBeTruthy()
  expect(screen.getByText(/Region prices cover every realm in US/)).toBeTruthy()
  expect(
    screen.getByRole('link', { name: 'Go to US market' }).getAttribute('href'),
  ).toBe('/us')
})

it('lists realms with a ruleset badge and a link per faction', async () => {
  setup(REALMS)
  const list = await screen.findByRole('list', { name: 'US realms' })
  const [gilneas] = within(list).getAllByRole('listitem')
  expect(gilneas.textContent).toContain('Gilneas')
  expect(gilneas.textContent).toContain('PvP')
  expect(
    within(gilneas)
      .getByRole('link', { name: 'Gilneas Alliance' })
      .getAttribute('href'),
  ).toBe('/us?realm=gilneas&faction=alliance')
  expect(
    within(gilneas)
      .getByRole('link', { name: 'Gilneas Horde' })
      .getAttribute('href'),
  ).toBe('/us?realm=gilneas&faction=horde')
})

it('filters by ruleset', async () => {
  setup(REALMS, 'rp')
  const list = await screen.findByRole('list', { name: 'US realms' })
  expect(
    within(list)
      .getAllByRole('listitem')
      .map((li) => li.textContent),
  ).toEqual([expect.stringContaining('Moonglade')])
})

it('says when a ruleset filter matches nothing and offers all types', async () => {
  setup(REALMS, 'rp-pvp')
  expect(await screen.findByText('No RP-PvP realms added for US.')).toBeTruthy()
  expect(
    screen
      .getByRole('link', { name: 'Show all realm types' })
      .getAttribute('href'),
  ).toBe('/us/realms')
})
