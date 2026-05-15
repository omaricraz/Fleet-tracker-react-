import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'

type DriverLogoutButtonProps = {
  className?: string
  iconClassName?: string
}

export function DriverLogoutButton({ className, iconClassName }: DriverLogoutButtonProps) {
  const { logout } = useAuth()
  return (
    <button
      type="button"
      className={cn(
        'text-muted-foreground transition-colors hover:text-foreground dark:hover:text-[#d3e4ff]',
        className,
      )}
      aria-label="Log out"
      onClick={() => void logout()}
    >
      <span className={cn('material-symbols-outlined !text-2xl', iconClassName)}>logout</span>
    </button>
  )
}
