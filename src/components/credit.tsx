import { cn } from '#/lib/utils'

export const TSM_URL = 'https://tradeskillmaster.com'

/** TSM term 1: credit wherever data is shown. */
export function Credit({ className }: { className?: string }) {
  return (
    <span className={className}>
      Pricing data from{' '}
      <a href={TSM_URL} className={cn('underline')} rel="noreferrer">
        TradeSkillMaster
      </a>
    </span>
  )
}

export const NOT_AFFILIATED =
  'Credit Sylvanas is a fan project. It is not affiliated with or endorsed by TradeSkillMaster or Blizzard Entertainment. World of Warcraft is a trademark of Blizzard Entertainment, Inc.'
