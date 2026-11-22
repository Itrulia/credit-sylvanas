// Shared diverging scale for every heatmap and the market map (DESIGN §5).
export type Bin = -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4
export const BINS: readonly Bin[] = [-4, -3, -2, -1, 0, 1, 2, 3, 4]
const EDGES = [0.02, 0.05, 0.15, 0.35] as const

export function binOf(ratio: number | null | undefined): Bin | null {
  if (ratio == null || !Number.isFinite(ratio)) {
    return null
  }
  const abs = Math.abs(ratio)
  const step = EDGES.filter((edge) => abs >= edge).length
  return (Math.sign(ratio) * step || 0) as Bin
}

const TOKEN: Record<Bin, string> = {
  [-4]: 'n4',
  [-3]: 'n3',
  [-2]: 'n2',
  [-1]: 'n1',
  0: '0',
  1: 'p1',
  2: 'p2',
  3: 'p3',
  4: 'p4',
}

export const binToken = (bin: Bin) => `--div-${TOKEN[bin]}`
export const binFill = (bin: Bin) => `var(${binToken(bin)})`

/** Text colour token that stays >= 4.5:1 on each bin fill. */
export function binInk(bin: Bin | null): string {
  return bin === null || Math.abs(bin) < 3 ? '--foreground' : '--card'
}

const MINUS = '−'
/** Each bin's range as text, so the legend never depends on hue. */
export const BIN_LABELS: Record<Bin, string> = {
  [-4]: `${MINUS}35% or less`,
  [-3]: `${MINUS}15 to ${MINUS}35%`,
  [-2]: `${MINUS}5 to ${MINUS}15%`,
  [-1]: `${MINUS}2 to ${MINUS}5%`,
  0: '±2%',
  1: '+2 to +5%',
  2: '+5 to +15%',
  3: '+15 to +35%',
  4: '+35% or more',
}
