import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { db } from '../db/client.ts'
import { buildDailyChange, buildHeatmap } from '../queries/heatmap.ts'
import type { DailyChange, HeatmapResult } from '../types.ts'
import { cachePublic } from './cache.ts'
import { HeatmapInput } from './inputs.ts'

export const getHeatmap = createServerFn({ method: 'GET' })
  .validator(HeatmapInput)
  .handler(async ({ data }): Promise<HeatmapResult> => {
    cachePublic()
    return buildHeatmap(db(), data, Date.now())
  })

export const heatmapQuery = (input: HeatmapInput) =>
  queryOptions({
    queryKey: ['getHeatmap', input],
    queryFn: () => getHeatmap({ data: input }),
  })

export const getDailyChange = createServerFn({ method: 'GET' })
  .validator(HeatmapInput)
  .handler(async ({ data }): Promise<DailyChange> => {
    cachePublic()
    return buildDailyChange(db(), data)
  })

export const dailyChangeQuery = (input: HeatmapInput) =>
  queryOptions({
    queryKey: ['getDailyChange', input],
    queryFn: () => getDailyChange({ data: input }),
  })
