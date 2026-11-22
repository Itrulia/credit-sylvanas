import { Skeleton } from '#/components/ui/skeleton'
import { m } from '#/i18n'
import type { HeatmapN } from '#/lib/search'

/** Final size of the day-by-day table: n rows of 28px cells plus the header. */
export function DailyChangeSkeleton({ n }: { n: HeatmapN | number }) {
  return (
    <div aria-busy="true" style={{ height: n * 30 + 40 }} className="relative">
      <Skeleton className="size-full rounded-md bg-muted" aria-hidden="true" />
      <span className="sr-only">{m.heatmap.dailyLoading()}</span>
    </div>
  )
}
