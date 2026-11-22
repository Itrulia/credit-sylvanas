import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { realmsFor } from '#/config/realms'
import { db } from '../db/client.ts'
import { itemHistory } from '../queries/history.ts'
import { getItem as getItemSql } from '../queries/item.ts'
import type { ItemHistory, ItemResult } from '../types.ts'
import { cachePublic } from './cache.ts'
import { ItemInput } from './inputs.ts'

export const getItem = createServerFn({ method: 'GET' })
  .validator(ItemInput)
  .handler(async ({ data }): Promise<ItemResult> => {
    cachePublic()
    return getItemSql(db(), data, Date.now(), realmsFor(data.region))
  })

export const itemQuery = (input: ItemInput) =>
  queryOptions({
    queryKey: ['getItem', input],
    queryFn: () => getItem({ data: input }),
  })

export const getItemHistory = createServerFn({ method: 'GET' })
  .validator(ItemInput)
  .handler(async ({ data }): Promise<ItemHistory> => {
    cachePublic()
    return itemHistory(db(), data, Date.now())
  })

export const itemHistoryQuery = (input: ItemInput) =>
  queryOptions({
    queryKey: ['getItemHistory', input],
    queryFn: () => getItemHistory({ data: input }),
  })
