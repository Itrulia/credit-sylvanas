// Must stay alphabetically sorted: Google Fonts icon_names contract (icons.test.ts enforces it).
// After a change, run `node scripts/fetch-icon-font.ts` to rebuild the self-hosted subset.
export const ICON_NAMES = [
  'arrow_downward',
  'arrow_upward',
  'check',
  'chevron_left',
  'chevron_right',
  'close',
  'error',
  'expand_less',
  'expand_more',
  'info',
  'menu',
  'open_in_new',
  'search',
  'unfold_more',
  'warning',
] as const
export type IconName = (typeof ICON_NAMES)[number]
