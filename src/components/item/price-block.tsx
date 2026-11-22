import type { ReactNode } from 'react'
import type { GlossaryKey } from '#/components/glossary'
import { GLOSSARY } from '#/components/glossary'
import { Delta } from '#/components/delta'
import { InfoPopover } from '#/components/info-popover'
import { Money } from '#/components/money'
import { formatNumber, formatPct } from '#/lib/format'
import type { ItemCurrent } from '#/server/types'

/** mv/hist outside 0.2–5 gets the Volatile badge (DESIGN §3 outlier rules). */
export const isVolatile = (mv: number, hist: number) =>
  hist > 0 && (mv / hist < 0.2 || mv / hist > 5)

function Stat({ term, children }: { term: GlossaryKey; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-center gap-1 text-label">
        {GLOSSARY[term].label}
        <InfoPopover term={term} />
      </dt>
      <dd className="num text-lg">{children}</dd>
    </div>
  )
}

/** Market value hero with the vs 60-day delta, then the supporting numbers. */
export function PriceBlock({ current }: { current: ItemCurrent }) {
  const noSales = current.asp === 0 && current.spd === 0
  const vsHist = current.hist > 0 ? current.mv / current.hist - 1 : null
  return (
    <section aria-labelledby="price-heading" className="ledger-rule pb-4">
      <h2 id="price-heading" className="sr-only">
        Current price
      </h2>
      {/* two lists: a <dl> allows only one wrapping div per dt/dd group */}
      <div className="flex flex-col gap-4">
        <dl className="flex flex-col gap-1">
          <dt className="flex items-center gap-1 text-label">
            Market value
            <InfoPopover term="marketValue" />
          </dt>
          <dd className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Money copper={current.mv} className="text-display" />
            <Delta value={vsHist} mode="vsHist" />
            <span className="text-sm text-muted-foreground">
              vs 60-day average
            </span>
          </dd>
        </dl>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat term="historical">
            <Money copper={current.hist} />
          </Stat>
          <Stat term="avgSalePrice">
            {noSales ? (
              <span className="text-sm text-muted-foreground">
                No recent sales
              </span>
            ) : (
              <Money copper={current.asp} />
            )}
          </Stat>
          <Stat term="soldPerDay">
            {noSales ? (
              <span className="text-sm text-muted-foreground">
                No recent sales
              </span>
            ) : (
              formatNumber(current.spd, current.spd < 10 ? 1 : 0)
            )}
          </Stat>
          <Stat term="saleRate">
            {formatPct(current.saleRate, { sign: false })}
          </Stat>
        </dl>
      </div>
    </section>
  )
}
