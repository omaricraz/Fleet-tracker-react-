import { useTheme } from 'next-themes'

export function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return {
    isDark,
    toggleTheme: () => setTheme(isDark ? 'light' : 'dark'),
  }
}
