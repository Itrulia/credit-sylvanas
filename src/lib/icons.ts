// Must stay alphabetically sorted: Google Fonts icon_names contract (icons.test.ts enforces it).
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

export const ICON_FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200' +
  `&icon_names=${ICON_NAMES.join(',')}&display=block`

export const TEXT_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Mono:wght@400..500&family=Atkinson+Hyperlegible+Next:ital,wght@0,400..700;1,400&family=Newsreader:opsz,wght@36,600&display=swap'
