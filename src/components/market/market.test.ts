import { describe, expect, it } from 'vitest'
import {
  barWidth,
  mapMetric,
  mapSummary,
  probeInput,
  resolveWindow,
} from './market'

const none = { d1: false, d7: false, d7From: null }
const d1Only = { d1: true, d7: false, d7From: 20_007 }
const both = { d1: true, d7: true, d7From: 20_007 }

describe('resolveWindow', () => {
  it('keeps an available price window and falls back to vs_hist otherwise', () => {
    expect(resolveWindow('price', 'vs_hist', none)).toBe('vs_hist')
    expect(resolveWindow('price', 'd1', both)).toBe('d1')
    expect(resolveWindow('price', 'd1', none)).toBe('vs_hist')
    expect(resolveWindow('price', 'd7', d1Only)).toBe('vs_hist')
  })

  it('turns sales + vs_hist into d7, else d1, else nothing', () => {
    expect(resolveWindow('sales', 'vs_hist', both)).toBe('d7')
    expect(resolveWindow('sales', 'vs_hist', d1Only)).toBe('d1')
    expect(resolveWindow('sales', 'vs_hist', none)).toBeNull()
    expect(resolveWindow('sales', 'd7', d1Only)).toBe('d1')
    expect(resolveWindow('sales', 'd1', both)).toBe('d1')
    expect(
      resolveWindow('sales', 'd1', { d1: false, d7: true, d7From: 1 }),
    ).toBe('d7')
  })
})

describe('probeInput', () => {
  it('never asks the server for sales + vs_hist', () => {
    expect(probeInput('us', 'sales', 'vs_hist')).toEqual({
      region: 'us',
      by: 'sales',
      metric: 'd1',
      dir: 1,
    })
    expect(probeInput('eu', 'price', 'd7')).toEqual({
      region: 'eu',
      by: 'price',
      metric: 'd7',
      dir: 1,
    })
  })
})

describe('barWidth', () => {
  it('scales against the chart max with a 2px floor', () => {
    expect(barWidth(0.5, 0.5)).toBe('max(2px, 100%)')
    expect(barWidth(-0.1, 0.4)).toBe('max(2px, 25%)')
    expect(barWidth(0, 0)).toBe('max(2px, 0%)')
  })
})

describe('mapMetric', () => {
  it('follows d1 only for price with d1 available', () => {
    expect(mapMetric('price', 'd1', true)).toBe('d1')
    expect(mapMetric('price', 'd1', false)).toBe('vs_hist')
    expect(mapMetric('sales', 'd1', true)).toBe('vs_hist')
    expect(mapMetric('price', 'd7', true)).toBe('vs_hist')
  })
})

describe('mapSummary', () => {
  it('counts tiles above and below the 2% band', () => {
    expect(mapSummary([0.1, 0.03, -0.5, 0.01, null], 'vs_hist')).toBe(
      'Top 5 items by gold traded per day. 2 above usual, 1 below.',
    )
    expect(mapSummary([0.1, -0.2, -0.3], 'd1')).toBe(
      'Top 3 items by gold traded per day. 1 rose since the previous daily update, 2 fell.',
    )
  })
})
