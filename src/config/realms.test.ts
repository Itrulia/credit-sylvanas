import { describe, expect, it } from 'vitest'
import type { RealmConfig } from './realms.ts'
import { REALMS, findRealm, realmsFor } from './realms.ts'

const sample: RealmConfig[] = [
  { region: 'us', slug: 'a', name: 'A', ruleset: 'pvp' },
  { region: 'eu', slug: 'b', name: 'B', ruleset: 'normal' },
]

describe('realms', () => {
  it('ships empty', () => {
    expect(REALMS).toEqual([])
    expect(realmsFor('us')).toEqual([])
  })

  it('filters by region and finds by slug', () => {
    expect(realmsFor('us', sample).map((r) => r.slug)).toEqual(['a'])
    expect(findRealm('eu', 'b', sample)?.name).toBe('B')
    expect(findRealm('us', 'b', sample)).toBeUndefined()
  })
})
