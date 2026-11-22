// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HotkeyManager } from '@tanstack/react-hotkeys'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ReactNode } from 'react'
import type { Command, DynamicGroup } from './command'
import { CommandPalette } from './command-palette'
import { CommandPaletteProvider } from './command-palette-provider'
import { CommandPaletteTrigger } from './command-palette-trigger'

const market = vi.fn()
const items = vi.fn()
const us = vi.fn()

const commands: Command[] = [
  { id: 'market', group: 'Navigate', title: 'Market', perform: market },
  { id: 'items', group: 'Navigate', title: 'Items', perform: items },
  {
    id: 'us',
    group: 'Region',
    title: 'Switch to US',
    keywords: ['americas'],
    perform: us,
  },
]

const onPlatform = (platform: string) => {
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform)
  HotkeyManager.resetInstance()
}

function setup(
  useDynamicGroups?: (q: string) => DynamicGroup[],
  ui: ReactNode = null,
) {
  return render(
    <CommandPaletteProvider
      commands={commands}
      useDynamicGroups={useDynamicGroups}
    >
      {ui}
      <CommandPalette />
    </CommandPaletteProvider>,
  )
}

const pressHotkey = () =>
  act(
    () =>
      void fireEvent.keyDown(document, {
        key: 'k',
        code: 'KeyK',
        metaKey: true,
      }),
  )
const input = () => screen.getByRole('combobox')
const type = (value: string) => fireEvent.change(input(), { target: { value } })
const press = (key: string) => fireEvent.keyDown(input(), { key })
const selected = () =>
  screen
    .getAllByRole('option')
    .find((row) => row.getAttribute('aria-selected') === 'true')?.textContent

beforeEach(() => {
  onPlatform('MacIntel')
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  HotkeyManager.resetInstance()
})

describe('CommandPalette', () => {
  it('toggles with Mod+K', async () => {
    setup()
    expect(screen.queryByRole('dialog')).toBeNull()
    pressHotkey()
    expect(await screen.findByRole('dialog')).toBeTruthy()
    pressHotkey()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('opens from the trigger, which shows the platform shortcut', async () => {
    setup(undefined, <CommandPaletteTrigger />)
    const trigger = screen.getByRole('button', { name: /search or jump to/i })
    expect(trigger.textContent).toContain('⌘')
    fireEvent.click(trigger)
    expect(await screen.findByRole('dialog')).toBeTruthy()
  })

  it('wraps around with the arrow keys and jumps with Home and End', async () => {
    setup()
    pressHotkey()
    await screen.findByRole('dialog')
    expect(selected()).toBe('Market')
    press('ArrowUp')
    expect(selected()).toBe('Switch to US')
    press('ArrowDown')
    expect(selected()).toBe('Market')
    press('End')
    expect(selected()).toBe('Switch to US')
    press('Home')
    expect(selected()).toBe('Market')
    expect(input().getAttribute('aria-activedescendant')).toBe(
      'command-palette-row-0',
    )
  })

  it('groups rows, highlights matched characters and announces the count', async () => {
    setup()
    pressHotkey()
    await screen.findByRole('dialog')
    expect(
      screen
        .getAllByRole('group')
        .map((g) => g.getAttribute('aria-labelledby')),
    ).toHaveLength(2)
    type('mar')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Market',
    ])
    expect(document.querySelector('mark')?.textContent).toBe('Mar')
    expect(screen.getByRole('status').textContent).toBe('1 result')
    type('zzz')
    expect(screen.getByRole('status').textContent).toBe('No results for zzz')
  })

  it('runs the selected command on Enter and closes', async () => {
    setup()
    pressHotkey()
    await screen.findByRole('dialog')
    type('americas')
    press('Enter')
    expect(us).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('selects on hover and runs on click', async () => {
    setup()
    pressHotkey()
    await screen.findByRole('dialog')
    const row = screen.getByRole('option', { name: 'Items' })
    fireEvent.mouseMove(row)
    expect(selected()).toBe('Items')
    fireEvent.click(row)
    expect(items).toHaveBeenCalledTimes(1)
  })

  it('appends dynamic groups to the keyboard order, with their status line', async () => {
    const live = vi.fn()
    const useItems = (q: string): DynamicGroup[] =>
      q.length >= 2
        ? [
            {
              id: 'items',
              label: 'Items',
              commands: [
                {
                  id: 'i1',
                  group: 'Items',
                  title: 'Arcanite Bar',
                  perform: live,
                },
              ],
            },
          ]
        : [
            {
              id: 'items',
              label: 'Items',
              commands: [],
              status: 'Type to search items',
            },
          ]
    setup(useItems)
    pressHotkey()
    await screen.findByRole('dialog')
    expect(screen.getByText('Type to search items')).toBeTruthy()
    type('ar')
    press('End')
    expect(selected()).toBe('Arcanite Bar')
    press('Enter')
    expect(live).toHaveBeenCalledTimes(1)
  })
})
