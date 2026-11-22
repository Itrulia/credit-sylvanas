import { median } from './median'
import type { HeatSort, Region } from './search'

// Kept generic so src/lib never imports from src/server.
export interface CellInput {
  mv: number
  hist: number
}
export type IndexedCell<TCell extends CellInput> = TCell & {
  index: number | null
}

/** index = mv / median(mv of listing regions) - 1, null with fewer than 2 listings. */
export function indexCells<TCell extends CellInput>(
  cells: Record<Region, TCell | null>,
): Record<Region, IndexedCell<TCell> | null> {
  const listed = Object.values(cells).filter(
    (c): c is TCell => c !== null && c.mv > 0,
  )
  const mid = listed.length >= 2 ? median(listed.map((c) => c.mv)) : null
  const out = {} as Record<Region, IndexedCell<TCell> | null>
  for (const [region, cell] of Object.entries(cells) as [
    Region,
    TCell | null,
  ][]) {
    out[region] = cell
      ? { ...cell, index: mid ? cell.mv / mid - 1 : null }
      : null
  }
  return out
}

/** (max - min) / median of listing regions, null with fewer than 2 listings. */
export function spreadOf(
  cells: Record<Region, CellInput | null>,
): number | null {
  const mvs = Object.values(cells)
    .filter((c): c is CellInput => c !== null && c.mv > 0)
    .map((c) => c.mv)
  if (mvs.length < 2) {
    return null
  }
  const mid = median(mvs)
  return mid ? (Math.max(...mvs) - Math.min(...mvs)) / mid : null
}

export interface SortableHeatRow {
  name: string
  goldVolume: number
  spread: number | null
}

/** volume and spread descending (null spread last), name ascending. */
export function sortHeatRows<TRow extends SortableHeatRow>(
  rows: readonly TRow[],
  sort: HeatSort,
): TRow[] {
  const copy = [...rows]
  if (sort === 'name') {
    return copy.sort((a, b) => a.name.localeCompare(b.name, 'en'))
  }
  if (sort === 'spread') {
    return copy.sort((a, b) => {
      if (a.spread === null) {
        return b.spread === null ? 0 : 1
      }
      return b.spread === null ? -1 : b.spread - a.spread
    })
  }
  return copy.sort((a, b) => b.goldVolume - a.goldVolume)
}
