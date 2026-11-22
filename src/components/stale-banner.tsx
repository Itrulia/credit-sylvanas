import { m } from '#/paraglide/messages.js'
import { formatDateTime } from '#/lib/format'
import { Icon } from './icon'

// one ingest a day means normal data can be nearly 48h old; 60h means a missed update
export const STALE_AFTER_SECONDS = 60 * 3_600

export const isStale = (updatedAt: number | null, nowSeconds: number) =>
  updatedAt !== null && nowSeconds - updatedAt > STALE_AFTER_SECONDS

export function StaleBanner({ updatedAt }: { updatedAt: number }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-subtle px-3 py-2 text-sm"
    >
      <Icon name="warning" className="mt-0.5 text-warning-text" />
      <p>
        <strong>{m.shell_staleTitle()}</strong>{' '}
        {m.shell_staleBody({ date: formatDateTime(updatedAt) })}
      </p>
    </div>
  )
}
