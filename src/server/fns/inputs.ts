import { z } from 'zod'
import {
  Faction,
  HeatmapN,
  HotBy,
  ItemSort,
  MoverBy,
  MoverMetric,
  Region,
  SortDir,
} from '#/lib/search'

// Server fn inputs, validated at the trust boundary. Imported by client code too.
export const RegionInput = z.object({ region: Region })
export type RegionInput = z.infer<typeof RegionInput>

export const ImportLogInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
})
export type ImportLogInput = z.input<typeof ImportLogInput>

export const HottestInput = z.object({
  region: Region,
  by: HotBy,
  limit: z.number().int().min(1).max(100),
})
export type HottestInput = z.infer<typeof HottestInput>

export const MoversInput = z
  .object({
    region: Region,
    by: MoverBy,
    metric: MoverMetric,
    dir: z.literal([1, -1]),
  })
  .refine((v) => !(v.by === 'sales' && v.metric === 'vs_hist'), {
    message: 'TSM has no 60-day sales average',
  })
export type MoversInput = z.infer<typeof MoversInput>

export const SearchInput = z.object({
  region: Region,
  q: z.string().trim().min(1).max(64),
})
export type SearchInput = z.infer<typeof SearchInput>

const realmContext = {
  realm: z.string().min(1).max(64).optional(),
  faction: Faction.optional(),
}

export const ListInput = z.object({
  region: Region,
  q: z.string().trim().max(64),
  sort: ItemSort,
  dir: SortDir,
  page: z.number().int().min(1).max(10_000),
  ...realmContext,
})
export type ListInput = z.infer<typeof ListInput>

export const ItemInput = z.object({
  region: Region,
  itemId: z.number().int().positive().max(1_000_000),
  ...realmContext,
})
export type ItemInput = z.infer<typeof ItemInput>

export const HeatmapInput = z.object({ region: Region, n: HeatmapN })
export type HeatmapInput = z.infer<typeof HeatmapInput>
