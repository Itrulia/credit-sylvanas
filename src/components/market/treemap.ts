export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

// worst aspect ratio of a row laid along `side` (Bruls, Huizing, van Wijk)
function worst(areas: number[], sum: number, side: number) {
  const max = Math.max(...areas)
  const min = Math.min(...areas)
  const s2 = side * side
  return Math.max((s2 * max) / (sum * sum), (sum * sum) / (s2 * min))
}

/**
 * Squarified treemap layout for values sorted largest first. Plain math, so
 * the market map renders on the server as plain HTML link tiles.
 */
export function squarify(
  values: number[],
  width: number,
  height: number,
): Rect[] {
  const total = values.reduce((sum, v) => sum + Math.max(v, 0), 0)
  const out: Rect[] = values.map(() => ({ x: 0, y: 0, w: 0, h: 0 }))
  if (total <= 0) {
    return out
  }
  const areas = values.map((v) => (Math.max(v, 0) * width * height) / total)
  let box: Rect = { x: 0, y: 0, w: width, h: height }
  let i = 0
  while (i < areas.length) {
    const side = Math.min(box.w, box.h)
    const row: number[] = []
    let sum = 0
    let best = Infinity
    while (i < areas.length) {
      const next = worst(
        [...row.map((j) => areas[j]), areas[i]],
        sum + areas[i],
        side,
      )
      if (row.length > 0 && next > best) {
        break
      }
      row.push(i)
      sum += areas[i]
      best = next
      i++
    }
    const thick = side > 0 ? sum / side : 0
    const vertical = box.w >= box.h
    let offset = 0
    for (const j of row) {
      const len = thick > 0 ? areas[j] / thick : 0
      out[j] = vertical
        ? { x: box.x, y: box.y + offset, w: thick, h: len }
        : { x: box.x + offset, y: box.y, w: len, h: thick }
      offset += len
    }
    box = vertical
      ? { x: box.x + thick, y: box.y, w: box.w - thick, h: box.h }
      : { x: box.x, y: box.y + thick, w: box.w, h: box.h - thick }
  }
  return out
}
