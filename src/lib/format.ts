import { m } from '#/paraglide/messages.js'
import { baseLocale } from '#/paraglide/runtime.js'

// The site locale, never the viewer's, so server and client render the same string.
const nf = new Intl.NumberFormat(baseLocale)
const MINUS = '−'

export const DAY_SECONDS = 86_400

export const formatNumber = (n: number, maxFractionDigits = 0) =>
  new Intl.NumberFormat(baseLocale, {
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

const dateParts = new Intl.DateTimeFormat(baseLocale, {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// Intl gives the localized pieces; the order stays the catalog's ("22 Nov 2026").
function partsOf(ms: number) {
  const p = Object.fromEntries(
    dateParts.formatToParts(ms).map(({ type, value }) => [type, value]),
  )
  return {
    weekday: p.weekday,
    day: p.day,
    month: p.month,
    year: p.year,
    time: `${p.hour}:${p.minute}`,
  }
}

/** Unix seconds -> "22 Nov 2026, 04:10 UTC". */
export function formatDateTime(unixSeconds: number) {
  return m.format_dateTime(partsOf(unixSeconds * 1000))
}

/** Day number (days since epoch, UTC) -> "22 Nov". */
export function formatDay(day: number) {
  const p = partsOf(day * DAY_SECONDS * 1000)
  return `${p.day} ${p.month}`
}

/** Day number -> "22 Nov 2026". */
export function formatDate(day: number) {
  const p = partsOf(day * DAY_SECONDS * 1000)
  return `${p.day} ${p.month} ${p.year}`
}

/** Day number -> "Sun 22 Nov 2026" (chart tooltip header). */
export function formatDayLong(day: number) {
  const p = partsOf(day * DAY_SECONDS * 1000)
  return `${p.weekday} ${p.day} ${p.month} ${p.year}`
}

export const isoFromUnix = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toISOString()

export const isoFromDay = (day: number) =>
  new Date(day * DAY_SECONDS * 1000).toISOString().slice(0, 10)

export const dayOf = (unixSeconds: number) =>
  Math.floor(unixSeconds / DAY_SECONDS)
