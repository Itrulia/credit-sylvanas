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
  itemFallback: ({ id }: { id: number }) => `Item #${id}`,
} satisfies Catalog
