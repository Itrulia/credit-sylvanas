// Dev-only fake history generator (DESIGN §3 Local development data). Pure, so it is testable.

export interface RealRow {
  itemId: number
  mv: number
  hist: number
  asp: number
  saleRate: number
  spd: number
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

export function seedOf(text: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 0x01000193)
  }
  return h >>> 0
}

const clamp = (x: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, x))

/**
 * Walks one item backwards from its real day-D row: a +-3% daily random walk
 * clamped to +-25% of the real value, plus a small weekday swing. Returns
 * rows for days D-1 ... D-back (index 0 is D-1).
 */
export function walkBack(
  region: string,
  row: RealRow,
  realDay: number,
  back = 89,
): RealRow[] {
  const rand = mulberry32(seedOf(`${region}:${row.itemId}`))
  const out: RealRow[] = []
  let factor = 1
  for (let k = 1; k <= back; k++) {
    factor = clamp(factor * (1 + (rand() * 2 - 1) * 0.03), 0.75, 1.25)
    // day 0 (1970-01-01) was a Thursday
    const weekday = (realDay - k + 4) % 7
    const swing = 1 + 0.02 * Math.sin((2 * Math.PI * weekday) / 7)
    const salesSwing = weekday === 0 || weekday === 6 ? 1.15 : 0.95
    const price = clamp(factor * swing, 0.75, 1.25)
    out.push({
      itemId: row.itemId,
      mv: Math.round(row.mv * price),
      hist: Math.round(row.hist * (1 + (factor - 1) * 0.3)),
      asp: Math.round(row.asp * price),
      saleRate: row.saleRate,
      spd:
        Math.round(row.spd * clamp(factor * salesSwing, 0.75, 1.25) * 1000) /
        1000,
    })
  }
  return out
}
