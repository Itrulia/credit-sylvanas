import { describe, expect, it } from 'vitest'
import regionCsv from '../__fixtures__/region-items.csv?raw'
import realmCsv from '../__fixtures__/realm-items.csv?raw'
import { REGION_HEADER, parseCsv, parseFile } from './csv.ts'

const NOW = Date.UTC(2026, 10, 22) / 1000

describe('parseCsv', () => {
  it('handles quoted commas and escaped quotes', () => {
    expect(parseCsv('a,b\n1,"Bar, ""Big"" one"\r\n2,x\n')).toEqual([
      ['a', 'b'],
      ['1', 'Bar, "Big" one'],
      ['2', 'x'],
    ])
  })
})

describe('parseFile', () => {
  it('parses the region fixture', () => {
    const r = parseFile('region', regionCsv, NOW)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.rows).toHaveLength(40)
      expect(r.rows[0]).toMatchObject({
        itemId: 878,
        name: 'Fist-sized Spinneret',
        mv: 99,
      })
      expect(r.updatedAtIso).toBe('2026-11-20T08:54:05Z')
      expect(r.updatedAt).toBe(Date.parse('2026-11-20T08:54:05Z') / 1000)
    }
  })

  it('parses a quoted name with a comma', () => {
    const text = `${REGION_HEADER}\n5,"Bar, Big",1,1,1,0.5,1,2026-11-20T08:54:05Z\n`
    const r = parseFile('region', text, NOW)
    expect(r.ok && r.rows[0].name).toBe('Bar, Big')
  })

  it('accepts an empty name', () => {
    const r = parseFile(
      'region',
      `${REGION_HEADER}\n5,,1,1,1,0.5,1,2026-11-20T08:54:05Z\n`,
      NOW,
    )
    expect(r.ok && r.rows[0].name).toBe('')
  })

  it('fails on a header mismatch', () => {
    const r = parseFile('region', 'itemId,name\n1,x\n', NOW)
    expect(r).toMatchObject({ ok: false })
    expect(!r.ok && r.reason).toMatch(/unexpected header/)
  })

  it('fails on an empty file', () => {
    expect(parseFile('region', '', NOW).ok).toBe(false)
    expect(parseFile('region', `${REGION_HEADER}\n`, NOW).ok).toBe(false)
  })

  it('rejects the 1970 realm fixture', () => {
    const r = parseFile('realm', realmCsv, NOW)
    expect(!r.ok && r.reason).toMatch(/implausible updatedAt/)
  })

  it('fails when more than 1% of rows are bad', () => {
    const good = Array.from(
      { length: 50 },
      (_, i) => `${i + 1},x,1,1,1,0.5,1,2026-11-20T08:54:05Z`,
    )
    const text = [
      REGION_HEADER,
      ...good,
      '-1,y,1,1,1,0.5,1,2026-11-20T08:54:05Z',
    ].join('\n')
    expect(parseFile('region', text, NOW).ok).toBe(false)
    const many = Array.from(
      { length: 200 },
      (_, i) => `${i + 1},x,1,1,1,0.5,1,2026-11-20T08:54:05Z`,
    )
    const ok = parseFile(
      'region',
      [REGION_HEADER, ...many, 'x,y,1,1,1,0.5,1,2026-11-20T08:54:05Z'].join(
        '\n',
      ),
      NOW,
    )
    expect(ok.ok && ok.bad).toBe(1)
  })

  it('fails when rows disagree on updatedAt', () => {
    const text = `${REGION_HEADER}\n1,a,1,1,1,0,0,2026-11-20T08:54:05Z\n2,b,1,1,1,0,0,2026-11-21T08:54:05Z\n`
    expect(parseFile('region', text, NOW).ok).toBe(false)
  })
})
