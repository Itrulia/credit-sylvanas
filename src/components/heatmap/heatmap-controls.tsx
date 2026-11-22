import { useId } from 'react'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { m } from '#/i18n'
import { HeatMetric, HeatmapN } from '#/lib/search'

export interface HeatmapControlsProps {
  n: HeatmapN
  metric: HeatMetric
  onN: (n: HeatmapN) => void
  onMetric: (metric: HeatMetric) => void
}

const METRIC_LABEL: Record<HeatMetric, () => string> = {
  index: m.heatmap.metricIndex,
  price: m.heatmap.metricPrice,
}
const item = 'min-h-11 min-w-11'

export function HeatmapControls({
  n,
  metric,
  onN,
  onMetric,
}: HeatmapControlsProps) {
  const itemsId = useId()
  const showId = useId()
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
      <div className="space-y-1">
        <p id={itemsId} className="text-label">
          {m.heatmap.controlsItemsLabel()}
        </p>
        <ToggleGroup
          type="single"
          variant="outline"
          aria-labelledby={itemsId}
          value={String(n)}
          onValueChange={(v) => {
            const parsed = HeatmapN.safeParse(Number(v))
            if (parsed.success) {
              onN(parsed.data)
            }
          }}
        >
          {[...HeatmapN.values].map((value) => (
            <ToggleGroupItem key={value} value={String(value)} className={item}>
              {value}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="space-y-1">
        <p id={showId} className="text-label">
          {m.heatmap.controlsShowLabel()}
        </p>
        <ToggleGroup
          type="single"
          variant="outline"
          aria-labelledby={showId}
          value={metric}
          onValueChange={(v) => {
            const parsed = HeatMetric.safeParse(v)
            if (parsed.success) {
              onMetric(parsed.data)
            }
          }}
        >
          {HeatMetric.options.map((value) => (
            <ToggleGroupItem key={value} value={value} className={item}>
              {METRIC_LABEL[value]()}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}
