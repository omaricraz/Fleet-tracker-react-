import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, KeyRound, Loader2, QrCode, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/features/auth/components/PasswordInput'
import { postLoginPath, useAuth } from '@/features/auth/AuthContext'
import { ApiError } from '@/services/api/client'
import { cn } from '@/lib/utils'

type FieldErrors = {
  email?: string
  password?: string
}

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    const trimmed = email.trim()
    if (!trimmed) {
      next.email = 'Enter your email address.'
    }
    if (!password) {
      next.password = 'Enter your password.'
    }
    return next
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    const nextErrors = validate()
    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setFormError(null)
    setIsSubmitting(true)
    try {
      const loggedInUser = await login(email.trim(), password, rememberMe)
      navigate(postLoginPath(loggedInUser), { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldMsg = err.firstFieldError()
        if (fieldMsg && err.errors.email) {
          setErrors((prev) => ({ ...prev, email: fieldMsg }))
        } else if (fieldMsg && err.errors.password) {
          setErrors((prev) => ({ ...prev, password: fieldMsg }))
        } else {
          setFormError(err.message)
        }
      } else {
        setFormError(err instanceof Error ? err.message : 'Unable to sign in.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={cn(
        'glass-login-panel w-full max-w-md rounded-xl p-6 shadow-[0_40px_80px_-20px_rgba(11,28,48,0.12)] md:p-10',
        'dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.35)]',
      )}
    >
      <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <div className="space-y-4">
          {formError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <label
              className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground"
              htmlFor="login-identifier"
            >
              Email
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <User
                  className="size-[18px] text-muted-foreground transition-colors group-focus-within:text-primary"
                  aria-hidden
                />
              </div>
              <input
                id="login-identifier"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                disabled={isSubmitting}
                placeholder="you@company.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'login-identifier-error' : undefined}
                className={cn(
                  'block w-full rounded-lg border-0 bg-muted py-3.5 pl-11 pr-4 text-sm text-foreground transition-all',
                  'placeholder:text-muted-foreground/55',
                  'focus:bg-surface-lowest focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
                  errors.email && 'ring-2 ring-destructive/45',
                  isSubmitting && 'cursor-not-allowed opacity-60',
                )}
              />
            </div>
            {errors.email ? (
              <p id="login-identifier-error" className="px-1 text-xs font-medium text-destructive" role="alert">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                htmlFor="login-password"
              >
                Password
              </label>
            </div>
            <PasswordInput
              id="login-password"
              name="password"
              value={password}
              onValueChange={(value) => {
                setPassword(value)
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              disabled={isSubmitting}
              error={errors.password}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="group flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting}
              className="size-4 rounded border border-muted-foreground/40 bg-muted text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            />
            <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary">
              Remember Me
            </span>
          </label>
          <a
            className="text-sm font-semibold text-primary transition-colors hover:text-primary-container dark:hover:text-primary"
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            Forgot Password?
          </a>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="hero-gradient h-auto w-full gap-2 rounded-lg py-4 text-sm font-bold tracking-wide shadow-lg shadow-primary/20 hover:brightness-110 hover:shadow-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Signing in
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="size-4" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-8 border-t border-surface-high pt-8">
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Secured Access
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-muted py-3 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-high disabled:cursor-not-allowed disabled:opacity-50"
          >
            <KeyRound className="size-[18px]" aria-hidden />
            SSO
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-muted py-3 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-high disabled:cursor-not-allowed disabled:opacity-50"
          >
            <QrCode className="size-[18px]" aria-hidden />
            Mobile
          </button>
        </div>
      </div>
    </div>
  )
}
