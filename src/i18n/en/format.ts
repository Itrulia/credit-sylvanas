import type { Catalog } from '../types'

export const format = {
  /** "22 Nov 2026, 04:10 UTC": the parts come from Intl, the order from here. */
  dateTime: ({
    day,
    month,
    year,
    time,
  }: {
    day: string
    month: string
    year: string
    time: string
  }) => `${day} ${month} ${year}, ${time} UTC`,
  /** Screen-reader price parts, joined with spaces: "1234 gold 5 silver 7 copper". */
  moneyGold: ({ n }: { n: number }) => `${n} gold`,
  moneySilver: ({ n }: { n: number }) => `${n} silver`,
  moneyCopper: ({ n }: { n: number }) => `${n} copper`,
  itemFallback: ({ id }: { id: number }) => `Item #${id}`,
} satisfies Catalog
