import { LOCALE } from './locale'

const rules = new Intl.PluralRules(LOCALE)

/**
 * Picks the form for n by the locale's CLDR plural category. Forms are whole
 * strings, so the caller puts the formatted count where the locale wants it:
 * `plural(n, { one: `${f} item`, other: `${f} items` })`.
 */
export function plural(
  n: number,
  forms: { one: string; other: string; zero?: string },
) {
  if (n === 0 && forms.zero !== undefined) {
    return forms.zero
  }
  return rules.select(n) === 'one' ? forms.one : forms.other
}
