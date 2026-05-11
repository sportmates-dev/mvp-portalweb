import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const THEME_STORAGE_KEY = 'sportmates-theme'

function getInitialTheme(): Theme {
  // 1. localStorage override
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored

  // 2. System preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'

  // 3. Default to light
  return 'light'
}

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    const initial = getInitialTheme()
    setTheme(initial)
    applyThemeToDOM(initial)
  }, [])

  // Apply theme to DOM on every change
  useEffect(() => {
    if (mounted) {
      applyThemeToDOM(theme)
    }
  }, [theme, mounted])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem(THEME_STORAGE_KEY, next)
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
