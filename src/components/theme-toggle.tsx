import { isDark, setTheme } from '#/lib/theme'
import { Icon } from './icon'

/** Both icons render; CSS picks one, since the theme is only known on the client. */
export function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Toggle dark theme"
      onClick={() => setTheme(isDark() ? 'light' : 'dark')}
      className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent pointer-coarse:size-11"
    >
      <Icon name="dark_mode" size={20} className="dark:hidden" />
      <Icon name="light_mode" size={20} className="hidden dark:inline-block" />
    </button>
  )
}
