import { useEffect } from 'react'
import { Truck } from 'lucide-react'

import { AuthFooter } from '@/features/auth/components/AuthFooter'
import { LoginForm } from '@/features/auth/components/LoginForm'

export function LoginPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Login | Fleet Tracker'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-10 sm:px-6 sm:py-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-[10%] -right-[5%] h-[60%] w-[40%] rounded-full bg-muted/50 blur-3xl" />
          <div className="absolute top-[40%] -left-[10%] h-[70%] w-[50%] rounded-full bg-accent/35 blur-3xl" />
        </div>

        <div className="relative z-10 flex w-full max-w-md flex-col items-center">
          <header className="mb-8 flex w-full flex-col items-center sm:mb-10">
            <div className="ambient-shadow mb-6 rounded-xl bg-surface-lowest p-4 dark:bg-card">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg hero-gradient text-primary-foreground shadow-[var(--shadow-soft)]"
                aria-hidden
              >
                <Truck className="size-6" strokeWidth={2.25} />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-black tracking-tighter text-primary dark:text-primary-foreground sm:text-[1.65rem]">
                Fleet Tracker
              </h1>
              <p className="flex items-center justify-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                <span className="size-1.5 shrink-0 rounded-full bg-primary dark:bg-primary-foreground" aria-hidden />
                Log in to your workspace
              </p>
            </div>
          </header>

          <LoginForm />

          <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
            New fleet manager?{' '}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="font-bold text-primary transition-colors hover:underline dark:text-primary-foreground"
            >
              Request Access
            </a>
          </p>
        </div>
      </main>

      <AuthFooter />
    </div>
  )
}
