import { useId, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

import { cn } from '@/lib/utils'

export type PasswordInputProps = {
  id?: string
  name?: string
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
}

export function PasswordInput({
  id: idProp,
  value,
  onValueChange,
  placeholder = '••••••••',
  disabled,
  error,
  className,
  name,
}: PasswordInputProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const [visible, setVisible] = useState(false)

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <Lock
            className="size-[18px] text-muted-foreground transition-colors group-focus-within:text-primary"
            aria-hidden
          />
        </div>
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-password-error` : undefined}
          autoComplete="current-password"
          className={cn(
            'block w-full rounded-lg border-0 bg-muted py-3.5 pl-11 pr-12 text-sm text-foreground transition-all',
            'placeholder:text-muted-foreground/55',
            'focus:bg-surface-lowest focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
            error && 'ring-2 ring-destructive/45',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-50"
          aria-label={visible ? 'Hide password' : 'Show password'}
          disabled={disabled}
        >
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-password-error`} className="px-1 text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
