import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { db } from '../db/client.ts'
import { listItems as listItemsSql } from '../queries/list.ts'
import { searchItems as searchItemsSql } from '../queries/search.ts'
import type { ListResult, SearchRow } from '../types.ts'
import { cachePublic } from './cache.ts'
import { ListInput, SearchInput } from './inputs.ts'

export const searchItems = createServerFn({ method: 'GET' })
  .validator(SearchInput)
  .handler(async ({ data }): Promise<SearchRow[]> => {
    cachePublic()
    return searchItemsSql(db(), data)
  })

export const searchItemsQuery = (input: SearchInput) =>
  queryOptions({
    queryKey: ['searchItems', input],
    queryFn: () => searchItems({ data: input }),
  })

export const listItems = createServerFn({ method: 'GET' })
  .validator(ListInput)
  .handler(async ({ data }): Promise<ListResult> => {
    cachePublic()
    return listItemsSql(db(), data)
  })

export const listItemsQuery = (input: ListInput) =>
  queryOptions({
    queryKey: ['listItems', input],
    queryFn: () => listItems({ data: input }),
  })
