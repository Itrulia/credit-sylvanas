export type ThemeMode = 'light' | 'dark' | 'system'

/** Runs before paint (ScriptOnce in the head): the only browser storage the site uses. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`

const prefersDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches

export function setTheme(mode: ThemeMode) {
  try {
    if (mode === 'system') {
      localStorage.removeItem('theme')
    } else {
      localStorage.setItem('theme', mode)
    }
  } catch {
    // storage blocked: the class below still applies for this page view
  }
  document.documentElement.classList.toggle(
    'dark',
    mode === 'dark' || (mode === 'system' && prefersDark()),
  )
}

export const isDark = () => document.documentElement.classList.contains('dark')
