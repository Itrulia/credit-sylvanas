import { describe, expect, it } from 'vitest'
import type { CommandMatch } from './command'
import { groupMatches } from './group-matches'

const match = (id: string, group: string): CommandMatch => ({
  command: { id, group, title: id, icon: null, perform: () => undefined },
  indices: [],
})

const shape = (groups: ReturnType<typeof groupMatches>) =>
  groups.map((group) => [
    group.group,
    group.matches.map(({ command }) => command.id),
  ])

// Ported from wepublish; the favourites cases are dropped with the favourites group.
describe('groupMatches', () => {
  it('returns nothing for no matches', () => {
    expect(groupMatches([])).toEqual([])
  })

  it('collects each group into one block', () => {
    expect(
      shape(
        groupMatches([
          match('market', 'Navigate'),
          match('us', 'Region'),
          match('items', 'Navigate'),
        ]),
      ),
    ).toEqual([
      ['Navigate', ['market', 'items']],
      ['Region', ['us']],
    ])
  })

  it('orders the blocks by their best match, so the top hit stays first', () => {
    expect(
      shape(groupMatches([match('us', 'Region'), match('market', 'Navigate')])),
    ).toEqual([
      ['Region', ['us']],
      ['Navigate', ['market']],
    ])
  })

  it('numbers the rows across blocks so one index can drive the keyboard', () => {
    const groups = groupMatches([
      match('market', 'Navigate'),
      match('us', 'Region'),
      match('items', 'Navigate'),
    ])
    expect(
      groups.flatMap((group) => group.matches.map((m) => m.index)),
    ).toEqual([0, 1, 2])
    expect(groups[1].matches[0].command.id).toBe('us')
    expect(groups[1].matches[0].index).toBe(2)
  })

  it('can continue numbering after earlier rows', () => {
    expect(groupMatches([match('a', 'X')], 5)[0].matches[0].index).toBe(5)
  })
})
