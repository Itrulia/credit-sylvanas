import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { HeatmapN, Region } from '#/lib/search'
import { dailyChangeQuery } from '#/server/fns/heatmap'
import { DailyChangeSkeleton } from './daily-change-skeleton'
import { DailyChangeTable } from './daily-change-table'

interface Props {
  region: Region
  n: HeatmapN
  busy: boolean
}

/** The streamed day-by-day table: the skeleton holds its size until the query settles. */
export function DailyChangeSection(props: Props) {
  return (
    <Suspense fallback={<DailyChangeSkeleton n={props.n} />}>
      <DailyChange {...props} />
    </Suspense>
  )
}

function DailyChange({ region, n, busy }: Props) {
  const { data } = useSuspenseQuery(dailyChangeQuery({ region, n }))
  return <DailyChangeTable region={region} data={data} busy={busy} />
}
