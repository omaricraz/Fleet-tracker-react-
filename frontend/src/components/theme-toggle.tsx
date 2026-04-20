import { MonitorCog, MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme ? resolvedTheme === 'dark' : undefined

  return (
    <Button
      className={cn('rounded-full', className)}
      variant="secondary"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark === undefined ? <MonitorCog /> : isDark ? <SunMedium /> : <MoonStar />}
    </Button>
  )
}
