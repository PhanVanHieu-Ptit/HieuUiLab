import { useEffect, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  resolvedTheme: ResolvedTheme
}

export const THEME_STORAGE_KEY = 'hieu-ui-lab:theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'
const SERVER_STATE: ThemeState = { theme: 'system', resolvedTheme: 'light' }

const listeners = new Set<() => void>()

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

function resolve(theme: Theme): ResolvedTheme {
  if (theme !== 'system') return theme
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function createState(theme: Theme): ThemeState {
  return { theme, resolvedTheme: resolve(theme) }
}

let state: ThemeState =
  typeof window === 'undefined' ? SERVER_STATE : createState(readStoredTheme())

function commit(next: ThemeState): void {
  state = next
  document.documentElement.classList.toggle('dark', next.resolvedTheme === 'dark')
  listeners.forEach((listener) => {
    listener()
  })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the theme still applies for this session.
  }
  commit(createState(theme))
}

/**
 * Light/dark/system theme backed by a module-level store so every consumer
 * stays in sync. The initial class is set by an inline script in index.html.
 */
export function useTheme(): ThemeState & { setTheme: (theme: Theme) => void } {
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  )

  useEffect(() => {
    if (current.theme !== 'system') return
    const query = window.matchMedia(DARK_QUERY)
    const onChange = () => {
      commit(createState('system'))
    }
    query.addEventListener('change', onChange)
    return () => {
      query.removeEventListener('change', onChange)
    }
  }, [current.theme])

  return { ...current, setTheme }
}
