import { useState } from 'react'
import { plural } from '#/lib/format'

export function countText(total: number, q: string) {
  return q
    ? `${plural(total, 'item', 'items')} matching "${q}"`
    : plural(total, 'item', 'items')
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
