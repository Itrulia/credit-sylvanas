import { m } from '#/paraglide/messages.js'
import { cn } from '#/lib/utils'

export const TSM_URL = 'https://tradeskillmaster.com'

/** TSM term 1: credit wherever data is shown. */
export function Credit({ className }: { className?: string }) {
  return (
    <span className={className}>
      {m.shell_creditLead()}{' '}
      <a href={TSM_URL} className={cn('underline')} rel="noreferrer">
        {m.shell_creditLink()}
      </a>
    </span>
  )
}

export const NOT_AFFILIATED = m.shell_notAffiliated()
