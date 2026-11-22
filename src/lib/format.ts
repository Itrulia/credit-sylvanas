// Fixed formatting (no viewer locale) so server and client render the same string.
const nf = new Intl.NumberFormat('en-US')
const MINUS = '−'

export const DAY_SECONDS = 86_400

export const formatNumber = (n: number, maxFractionDigits = 0) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFractionDigits,
  }).format(n)

export const formatInt = (n: number) => nf.format(Math.round(n))

/** Ratio to percent with one decimal and a real minus sign: 0.124 -> "+12.4%". */
export function formatPct(
  ratio: number,
  { decimals = 1, sign = true }: { decimals?: number; sign?: boolean } = {},
) {
  const value = Math.abs(ratio * 100)
  const rounded = value.toFixed(decimals)
  const isZero = Number(rounded) === 0
  const prefix = !sign || isZero ? '' : ratio < 0 ? MINUS : '+'
  return `${prefix}${rounded}%`
}

const pad = (n: number) => String(n).padStart(2, '0')
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Unix seconds -> "22 Nov 2026, 04:10 UTC". */
export function formatDateTime(unixSeconds: number) {
  const d = new Date(unixSeconds * 1000)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

/** Day number (days since epoch, UTC) -> "22 Nov". */
export function formatDay(day: number) {
  const d = new Date(day * DAY_SECONDS * 1000)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

/** Day number -> "22 Nov 2026". */
export function formatDate(day: number) {
  const d = new Date(day * DAY_SECONDS * 1000)
  return `${formatDay(day)} ${d.getUTCFullYear()}`
}

/** Day number -> "Sun 22 Nov 2026" (chart tooltip header). */
export function formatDayLong(day: number) {
  const d = new Date(day * DAY_SECONDS * 1000)
  return `${WEEKDAYS[d.getUTCDay()]} ${formatDate(day)}`
}

export const isoFromUnix = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toISOString()

export const isoFromDay = (day: number) =>
  new Date(day * DAY_SECONDS * 1000).toISOString().slice(0, 10)

export const dayOf = (unixSeconds: number) =>
  Math.floor(unixSeconds / DAY_SECONDS)

const rules = new Intl.PluralRules('en-US')

/** plural(3, 'item', 'items') -> "3 items" */
export function plural(n: number, one: string, other: string) {
  return `${nf.format(n)} ${rules.select(n) === 'one' ? one : other}`
}
