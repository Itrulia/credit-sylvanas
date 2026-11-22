import type { CoinUnit, MoneyPart, MoneyVariant } from '#/lib/money'
import { formatMoney, moneyLabel } from '#/lib/money'
import { cn } from '#/lib/utils'

const COIN: Record<CoinUnit, string> = {
  g: 'text-coin-gold',
  s: 'text-coin-silver',
  c: 'text-coin-copper',
}

export interface MoneyProps {
  copper: number | null
  variant?: MoneyVariant
  /** table columns: three fixed slots so the g letters line up */
  align?: boolean
  /** sr-only text for null */
  reason?: string
  className?: string
}

function Part({ part }: { part: MoneyPart }) {
  return (
    <span aria-hidden="true">
      {part.amount}
      <span className={cn('text-[0.85em] font-semibold', COIN[part.unit])}>
        {part.unit}
      </span>
    </span>
  )
}

export function Money({
  copper,
  variant = 'full',
  align,
  reason = 'No data',
  className,
}: MoneyProps) {
  if (copper === null) {
    return (
      <span className={cn('num text-muted-foreground', className)}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{reason}</span>
      </span>
    )
  }
  const parts = formatMoney(copper, variant)
  return (
    <data
      value={copper}
      className={cn(
        'num whitespace-nowrap',
        align ? 'money-grid gap-x-1' : 'inline-flex gap-1',
        className,
      )}
    >
      {/* aria-label is prohibited on <data> (generic role), so the label is text */}
      <span className="sr-only">{moneyLabel(copper)}</span>
      {align
        ? (['g', 's', 'c'] as const).map((unit) => {
            const part = parts.find((p) => p.unit === unit)
            return part ? (
              <Part key={unit} part={part} />
            ) : (
              <span key={unit} aria-hidden="true" />
            )
          })
        : parts.map((p) => <Part key={p.unit} part={p} />)}
    </data>
  )
}
