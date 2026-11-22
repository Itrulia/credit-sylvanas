import { useState } from 'react'
import { m } from '#/paraglide/messages.js'
import { formatInt } from '#/lib/format'

export function countText(total: number, q: string) {
  const count = formatInt(total)
  return q
    ? m.items_countMatchingLabel({ n: total, count, q })
    : m.items_countLabel({ n: total, count })
}

/**
 * Live result count. While a query is in flight it keeps the last settled
 * text, so screen readers hear one update per settled query.
 */
export function ItemsCount({
  total,
  q,
  busy,
}: {
  total: number
  q: string
  busy: boolean
}) {
  const next = countText(total, q)
  const [shown, setShown] = useState(next)
  if (!busy && shown !== next) {
    setShown(next)
  }
  return (
    <p
      role="status"
      aria-live="polite"
      className="text-sm text-muted-foreground"
    >
      {busy ? shown : next}
    </p>
  )
}
