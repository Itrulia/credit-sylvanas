import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { db } from '../db/client.ts'
import { hottest } from '../queries/hottest.ts'
import { movers } from '../queries/movers.ts'
import { rising } from '../queries/rising.ts'
import type { HotRow, MoversResult, RisingResult } from '../types.ts'
import { cachePublic } from './cache.ts'
import { HottestInput, MoversInput, RegionInput } from './inputs.ts'

export const getHottest = createServerFn({ method: 'GET' })
  .validator(HottestInput)
  .handler(async ({ data }): Promise<HotRow[]> => {
    cachePublic()
    return hottest(db(), data)
  })

export const hottestQuery = (input: HottestInput) =>
  queryOptions({
    queryKey: ['getHottest', input],
    queryFn: () => getHottest({ data: input }),
  })

export const getMovers = createServerFn({ method: 'GET' })
  .validator(MoversInput)
  .handler(async ({ data }): Promise<MoversResult> => {
    cachePublic()
    return movers(db(), data)
  })

export const moversQuery = (input: MoversInput) =>
  queryOptions({
    queryKey: ['getMovers', input],
    queryFn: () => getMovers({ data: input }),
  })

export const getMarketMap = createServerFn({ method: 'GET' })
  .validator(RegionInput)
  .handler(async ({ data }): Promise<HotRow[]> => {
    cachePublic()
    return hottest(db(), { region: data.region, by: 'gold', limit: 100 })
  })

export const marketMapQuery = (input: RegionInput) =>
  queryOptions({
    queryKey: ['getMarketMap', input],
    queryFn: () => getMarketMap({ data: input }),
  })

export const getRising = createServerFn({ method: 'GET' })
  .validator(RegionInput)
  .handler(async ({ data }): Promise<RisingResult> => {
    cachePublic()
    return rising(db(), data)
  })

export const risingQuery = (input: RegionInput) =>
  queryOptions({
    queryKey: ['getRising', input],
    queryFn: () => getRising({ data: input }),
  })
