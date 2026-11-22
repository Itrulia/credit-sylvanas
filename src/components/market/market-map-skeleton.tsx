import { useEffect, useState } from 'react'

export const MAP_BOX = 'h-[28rem] w-full sm:aspect-[2/1] sm:h-auto'

/** Static, final-size placeholder while the map streams in. No shimmer. */
export function MarketMapSkeleton() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 10_000)
    return () => clearTimeout(timer)
  }, [])
  return (
    <div aria-busy="true" className="space-y-3" data-market-map-skeleton="">
      <span className="sr-only">Loading market map…</span>
      <div
        aria-hidden="true"
        className="h-5 w-3/4 max-w-xl rounded-sm bg-muted"
      />
      <div aria-hidden="true" className="h-8 w-28 rounded-md bg-muted" />
      <div aria-hidden="true" className={`${MAP_BOX} rounded-md bg-muted`} />
      <div
        aria-hidden="true"
        className="h-9 w-full max-w-2xl rounded-sm bg-muted"
      />
      {slow && (
        <p className="text-sm text-muted-foreground">
          Still loading. This is taking longer than usual.
        </p>
      )}
    </div>
  )
}
