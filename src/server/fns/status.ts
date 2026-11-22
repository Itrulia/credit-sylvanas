import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import {
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server'
import { db } from '../db/client.ts'
import { regionStatus } from '../queries/status.ts'
import type { RegionStatus } from '../types.ts'
import { cachePublic } from './cache.ts'
import { RegionInput } from './inputs.ts'

export const getRegionStatus = createServerFn({ method: 'GET' })
  .validator(RegionInput)
  .handler(async ({ data }): Promise<RegionStatus> => {
    const status = await regionStatus(db(), data.region)
    if (status.hasData) {
      cachePublic()
    } else {
      setResponseStatus(503)
      setResponseHeader('Cache-Control', 'no-store')
    }
    return status
  })

export const regionStatusQuery = (input: RegionInput) =>
  queryOptions({
    queryKey: ['getRegionStatus', input],
    queryFn: () => getRegionStatus({ data: input }),
  })
