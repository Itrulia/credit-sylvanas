import { m } from '#/i18n'
import { LOCALE } from '#/i18n/locale'

// Prices are integer copper everywhere; this is the one place they become g/s/c.
export type CoinUnit = 'g' | 's' | 'c'
export interface MoneyPart {
  amount: string
  unit: CoinUnit
}
export type MoneyVariant = 'full' | 'compact' | 'axis'

const nf = new Intl.NumberFormat(LOCALE)
const pad = (n: number) => String(n).padStart(2, '0')

const split = (copper: number) => ({
  g: Math.floor(copper / 10_000),
  s: Math.floor((copper % 10_000) / 100),
  c: copper % 100,
})

function full(copper: number): MoneyPart[] {
  const { g, s, c } = split(copper)
  const parts: MoneyPart[] = []
  if (g) {
    parts.push({ amount: nf.format(g), unit: 'g' })
  }
  if (s) {
    parts.push({ amount: g ? pad(s) : String(s), unit: 's' })
  }
  if (c || parts.length === 0) {
    parts.push({ amount: g || s ? pad(c) : String(c), unit: 'c' })
  }
  return parts
}

function compact(copper: number): MoneyPart[] {
  // decide on the rounded silver, so 999g 99s 60c becomes 1,000g rather than 1,000g 00s
  const silver = Math.round(copper / 100)
  if (silver >= 100_000) {
    return [{ amount: nf.format(Math.round(copper / 10_000)), unit: 'g' }]
  }
  if (copper >= 10_000) {
    const g = Math.floor(silver / 100)
    return [
      { amount: nf.format(g), unit: 'g' },
      { amount: pad(silver % 100), unit: 's' },
    ]
  }
  const { s, c } = split(copper)
  return s
    ? [
        { amount: String(s), unit: 's' },
        { amount: pad(c), unit: 'c' },
      ]
    : [{ amount: String(c), unit: 'c' }]
}

const sig3 = (n: number) => Number(n.toPrecision(3))

function axis(copper: number): MoneyPart[] {
  const gold = copper / 10_000
  if (gold >= 10_000) {
    return [{ amount: `${nf.format(sig3(gold / 1_000))}k`, unit: 'g' }]
  }
  if (gold >= 1) {
    return [{ amount: nf.format(sig3(gold)), unit: 'g' }]
  }
  if (copper >= 100) {
    return [{ amount: nf.format(sig3(copper / 100)), unit: 's' }]
  }
  return [{ amount: String(copper), unit: 'c' }]
}

export function formatMoney(copper: number, variant: MoneyVariant = 'full') {
  const value = Math.max(0, Math.round(copper))
  if (variant === 'compact') {
    return compact(value)
  }
  if (variant === 'axis') {
    return axis(value)
  }
  return full(value)
}

export const moneyText = (parts: MoneyPart[]) =>
  parts.map((p) => `${p.amount}${p.unit}`).join(' ')

const WORDS: Record<CoinUnit, (p: { n: number }) => string> = {
  g: m.format.moneyGold,
  s: m.format.moneySilver,
  c: m.format.moneyCopper,
}

export function moneyLabel(copper: number) {
  const { g, s, c } = split(Math.max(0, Math.round(copper)))
  const parts = (
    [
      [g, 'g'],
      [s, 's'],
      [c, 'c'],
    ] as const
  )
    .filter(([n]) => n > 0)
    .map(([n, u]) => WORDS[u]({ n }))
  return parts.length ? parts.join(' ') : m.format.moneyCopper({ n: 0 })
}
