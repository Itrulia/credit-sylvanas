import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BINS, binInk, binToken } from './bins'

// Parses src/styles.css, so no token value is copied here by hand (DESIGN §4).
type RGB = [number, number, number]

const css = readFileSync('src/styles.css', 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
)

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  const body = css.slice(start, css.indexOf('}', start))
  const out: Record<string, string> = {}
  for (const m of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    out[m[1]] = m[2].replace(/\s+/g, ' ').trim()
  }
  return out
}

const root = block(':root')
const themes = { light: root, dark: { ...root, ...block('.dark') } }

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const gamma = (x: number) =>
  x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055
const lin = (x: number) =>
  x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4

function oklch(L: number, C: number, H: number): RGB {
  const h = (H * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.round(clamp(gamma(v)) * 255)) as RGB
}

function color(vars: Record<string, string>, name: string, depth = 0): RGB {
  const raw = vars[name]
  if (!raw || depth > 10) {
    throw new Error(`unknown token --${name}`)
  }
  const ref = /^var\(--([\w-]+)\)$/.exec(raw)
  if (ref) {
    return color(vars, ref[1], depth + 1)
  }
  const ok = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(raw)
  if (ok) {
    return oklch(Number(ok[1]), Number(ok[2]), Number(ok[3]))
  }
  const hex = /^#([0-9a-f]{6})$/i.exec(raw)
  if (hex) {
    return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)) as RGB
  }
  throw new Error(`cannot parse --${name}: ${raw}`)
}

const lum = (c: RGB) => {
  const [r, g, b] = c.map((v) => lin(v / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (hi + 0.05) / (lo + 0.05)
}
function oklab(c: RGB) {
  const [r, g, b] = c.map((v) => lin(v / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}
const deltaE = (a: RGB, b: RGB) => {
  const [p, q] = [oklab(a), oklab(b)]
  return 100 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
}

type Pair = [fg: string, bg: string, min: number]
const SURFACES = ['background', 'card', 'muted', 'accent']
const TEXT = [
  'foreground',
  'muted-foreground',
  'up',
  'down',
  'primary',
  'success-text',
  'warning-text',
  'info-text',
  'destructive-text',
  'coin-gold',
  'coin-silver',
  'coin-copper',
]
const STATUS = ['success', 'warning', 'info', 'destructive']

const shared: Pair[] = [
  ...TEXT.flatMap((t) => SURFACES.map((s): Pair => [t, s, 4.5])),
  ...['primary', 'primary-hover', 'primary-active'].map((f): Pair => [
    'primary-foreground',
    f,
    4.5,
  ]),
  ...['secondary', 'secondary-hover', 'secondary-active'].map((f): Pair => [
    'secondary-foreground',
    f,
    4.5,
  ]),
  ...['destructive', 'destructive-hover', 'destructive-active'].map(
    (f): Pair => ['destructive-foreground', f, 4.5],
  ),
  ...['success', 'warning', 'info'].map((s): Pair => [
    `${s}-foreground`,
    s,
    4.5,
  ]),
  ...STATUS.map((s): Pair => [`${s}-text`, `${s}-subtle`, 4.5]),
  ...STATUS.map((s): Pair => ['foreground', `${s}-subtle`, 4.5]),
  ['brand-tomato-foreground', 'brand-tomato', 4.5],
  ...SURFACES.map((s): Pair => ['ring', s, 3]),
  ...['background', 'card', 'muted'].map((s): Pair => ['input', s, 3]),
  ...STATUS.flatMap((s) =>
    [`${s}-subtle`, 'card', 'background'].map((b): Pair => [
      `${s}-border`,
      b,
      3,
    ]),
  ),
  ...['primary', 'destructive'].flatMap((f) =>
    ['background', 'card'].map((b): Pair => [f, b, 3]),
  ),
  ...['chart-4', 'chart-3'].flatMap((f) =>
    ['background', 'card'].map((b): Pair => [f, b, 3]),
  ),
  ...['us', 'eu', 'kr', 'tw'].flatMap((r) =>
    ['background', 'card'].map((b): Pair => [`region-${r}`, b, 4.5]),
  ),
  ['brand-tomato', 'card', 3],
]
const PAIRS = {
  light: shared,
  dark: [...shared, ['brand-tomato', 'background', 3] as Pair],
}

describe.each(['light', 'dark'] as const)('%s theme contrast', (theme) => {
  const vars = themes[theme]
  const c = (n: string) => color(vars, n)

  it.each(PAIRS[theme])('--%s on --%s >= %s', (fg, bg, min) => {
    expect(ratio(c(fg), c(bg))).toBeGreaterThanOrEqual(min)
  })

  it('keeps the muted rust apart from destructive and tomato', () => {
    expect(deltaE(c('up'), c('destructive'))).toBeGreaterThanOrEqual(7)
    expect(deltaE(c('up'), c('brand-tomato'))).toBeGreaterThanOrEqual(15)
  })

  it.each(BINS)('binInk on bin %s >= 4.5', (bin) => {
    const ink = binInk(bin, theme).slice(2)
    const fill = binToken(bin).slice(2)
    expect(ratio(c(ink), c(fill))).toBeGreaterThanOrEqual(4.5)
  })
})
