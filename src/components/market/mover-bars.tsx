import { useId } from 'react'
import { useSuspenseQueries } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Delta } from '#/components/delta'
import { Icon } from '#/components/icon'
import { InfoPopover } from '#/components/info-popover'
import { ItemLink } from '#/components/item-link'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { REGION_INFO } from '#/config/regions'
import { m } from '#/i18n'
import { formatDate, formatNumber } from '#/lib/format'
import { MoverBy, MoverMetric } from '#/lib/search'
import type { Region } from '#/lib/search'
import { cn } from '#/lib/utils'
import { moversQuery } from '#/server/fns/market'
import type { MoverRow, MoversResult } from '#/server/types'
import { barWidth } from './market'

const title = (dir: 1 | -1) =>
  dir > 0 ? m.market.moverIncrease() : m.market.moverDecrease()
const DIRS = [1, -1] as const

export interface MoverChartProps {
  region: Region
  dir: 1 | -1
  by: MoverBy
  window: MoverMetric
  rows: MoverRow[]
}

/** One chart as a real table, so names stay links and the bars can be ignored. */
export function MoverChart({ region, dir, by, window, rows }: MoverChartProps) {
  const max = Math.max(0, ...rows.map((r) => Math.abs(r.change)))
  const k = rows.length
  return (
    <div className="space-y-2">
      <h3 className="text-label">{title(dir)}</h3>
      {k === 0 ? (
        <p className="flex items-start gap-2 rounded-md border border-dashed p-4 text-sm">
          <Icon name="info" className="mt-0.5 text-muted-foreground" />
          <span>{m.market.moverNothing({ window })}</span>
        </p>
      ) : (
        // same box as the Hottest table (DataTable); relative keeps sr-only text inside
        <div className="relative rounded-md border px-3 py-1">
          <table className="w-full table-fixed border-collapse text-[0.8125rem] leading-[1.125rem]">
            <caption className="sr-only">
              {m.market.moverCaption({
                n: k,
                region: REGION_INFO[region].name,
                by,
                dir,
                window,
              })}
              {k < 10 && ` ${m.market.moverFew({ n: k })}`}
            </caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">{m.market.itemHeader()}</th>
                <td />
                <th scope="col">
                  {by === 'price'
                    ? m.market.changeHeader()
                    : m.market.measurePopularity()}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t first:border-t-0">
                  <th
                    scope="row"
                    className="w-[46%] py-1.5 pr-3 text-left align-middle font-normal"
                  >
                    <ItemLink id={r.id} name={r.name} region={region} />
                  </th>
                  <td aria-hidden="true" className="py-1.5 align-middle">
                    <div
                      className={cn(
                        'flex h-4 items-center border-border-strong',
                        dir > 0
                          ? 'justify-start border-l'
                          : 'justify-end border-r',
                      )}
                    >
                      <span
                        data-bar
                        className={cn(
                          'h-3 rounded-[1px]',
                          dir > 0 ? 'bg-up' : 'bg-down',
                        )}
                        style={{ width: barWidth(r.change, max) }}
                      />
                    </div>
                  </td>
                  <td className="w-[6.5rem] py-1.5 pl-3 text-right align-middle">
                    <Delta
                      value={r.change}
                      mode={window === 'vs_hist' ? 'vsHist' : 'change'}
                    />
                    {by === 'sales' && (
                      <div className="text-micro text-muted-foreground">
                        {m.market.moverPerDay({
                          from: formatNumber(r.from, 1),
                          to: formatNumber(r.to, 1),
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const INTRO: Record<MoverBy, Partial<Record<MoverMetric, () => string>>> = {
  price: {
    vs_hist: m.market.introPriceVsHist,
    d1: m.market.introPriceD1,
    d7: m.market.introPriceD7,
  },
  sales: {
    d1: m.market.introSalesD1,
    d7: m.market.introSalesD7,
  },
}

const WINDOW_LABEL: Record<MoverMetric, () => string> = {
  vs_hist: m.market.windowVsHist,
  d1: m.market.windowD1,
  d7: m.market.windowD7,
}

export interface MoverBarsProps {
  region: Region
  by: MoverBy
  /** the window the charts show, already resolved; null when Popularity has none yet */
  window: MoverMetric | null
  available: MoversResult['available']
  /** day of the next daily update and distinct days saved, for the "available from" copy */
  nextDay: number | null
  days: number
}

/** Measure and Window toggles over the Biggest increase and decrease charts. */
export function MoverBars({
  region,
  by,
  window,
  available,
  nextDay,
  days,
}: MoverBarsProps) {
  const navigate = useNavigate({ from: '/$region/' })
  const id = useId()
  const [up, down] = useSuspenseQueries({
    queries: window
      ? DIRS.map((dir) => moversQuery({ region, by, metric: window, dir }))
      : [],
  })
  const reasons: Partial<Record<MoverMetric, string>> = {}
  if (by === 'sales') {
    reasons.vs_hist = m.market.reasonNoSalesAverage()
  }
  if (!available.d1) {
    reasons.d1 =
      nextDay !== null
        ? m.market.reasonD1On({ date: formatDate(nextDay) })
        : m.market.reasonD1Later()
  }
  if (!available.d7) {
    reasons.d7 =
      available.d7From !== null
        ? m.market.reasonD7On({ date: formatDate(available.d7From), days })
        : m.market.reasonD7Later({ days })
  }
  const toggle = 'pointer-coarse:h-11'
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <div className="space-y-1">
          <p id={`${id}-by`} className="text-label flex min-h-6 items-center">
            {m.market.measureLabel()}
          </p>
          <div className="flex items-center gap-1">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={by}
              aria-labelledby={`${id}-by`}
              onValueChange={(v) => {
                const next = MoverBy.safeParse(v)
                if (next.success) {
                  void navigate({
                    search: (prev) => ({ ...prev, by: next.data }),
                    resetScroll: false,
                  })
                }
              }}
            >
              <ToggleGroupItem value="price" className={toggle}>
                {m.market.measurePrice()}
              </ToggleGroupItem>
              <ToggleGroupItem value="sales" className={toggle}>
                {m.market.measurePopularity()}
              </ToggleGroupItem>
            </ToggleGroup>
            {/* defines the Popularity option, so it sits next to it */}
            <InfoPopover term="popularity" />
          </div>
        </div>
        <div className="space-y-1">
          <p id={`${id}-win`} className="text-label flex min-h-6 items-center">
            {m.market.windowLabel()}
          </p>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={window ?? ''}
            aria-labelledby={`${id}-win`}
            onValueChange={(v) => {
              const next = MoverMetric.safeParse(v)
              if (next.success) {
                void navigate({
                  search: (prev) => ({ ...prev, movers: next.data }),
                  resetScroll: false,
                })
              }
            }}
          >
            {MoverMetric.options.map((w) => (
              <ToggleGroupItem
                key={w}
                value={w}
                disabled={reasons[w] !== undefined}
                aria-describedby={reasons[w] ? `${id}-${w}` : undefined}
                className={toggle}
              >
                {WINDOW_LABEL[w]()}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      {Object.keys(reasons).length > 0 && (
        <ul className="text-micro space-y-0.5 text-muted-foreground">
          {MoverMetric.options.map(
            (w) =>
              reasons[w] && (
                <li key={w} id={`${id}-${w}`}>
                  {reasons[w]}
                </li>
              ),
          )}
        </ul>
      )}
      {window ? (
        <>
          <p className="text-sm">{INTRO[by][window]?.()}</p>
          <MoverChart
            region={region}
            dir={1}
            by={by}
            window={window}
            rows={up.data.rows}
          />
          <MoverChart
            region={region}
            dir={-1}
            by={by}
            window={window}
            rows={down.data.rows}
          />
        </>
      ) : (
        DIRS.map((dir) => (
          <div key={dir} className="space-y-2">
            <h3 className="text-label">{title(dir)}</h3>
            <div className="rounded-md border border-dashed p-4 text-sm">
              <p className="font-semibold">
                {nextDay !== null
                  ? m.market.popularityStartsOn({ date: formatDate(nextDay) })
                  : m.market.popularityStartsLater()}
              </p>
              <p>{m.market.popularityNeed()}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
