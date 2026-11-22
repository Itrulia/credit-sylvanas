import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import { db } from '../db/client.ts'
import { importLog } from '../queries/imports.ts'
import type { ImportLogRow } from '../types.ts'
import { cachePublic } from './cache.ts'
import { ImportLogInput } from './inputs.ts'

export const getImportLog = createServerFn({ method: 'GET' })
  .validator(ImportLogInput)
  .handler(async ({ data }): Promise<ImportLogRow[]> => {
    cachePublic()
    return importLog(db(), data.limit)
  })

export const importLogQuery = (input: ImportLogInput = {}) =>
  queryOptions({
    queryKey: ['getImportLog', input],
    queryFn: () => getImportLog({ data: input }),
  })
