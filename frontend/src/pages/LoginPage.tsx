import { ArrowRight, LockKeyhole } from 'lucide-react'

import { Card } from '@/components/Card'
import { AppLogo } from '@/components/navigation/app-logo'
import { PageHeader } from '@/components/PageHeader'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="hero-gradient relative overflow-hidden rounded-[calc(var(--radius-xl)+8px)] p-8 text-primary-foreground shadow-[var(--shadow-ambient)] md:p-10">
        <div className="absolute inset-y-0 right-[-10%] w-56 rounded-full bg-white/8 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between gap-12">
          <AppLogo compact className="text-primary-foreground" />
          <div className="space-y-6">
            <p className="eyebrow text-primary-foreground/70">Fleet Tracker</p>
            <h1 className="max-w-lg text-4xl font-black tracking-[-0.04em] text-primary-foreground md:text-5xl">
              Production-ready frontend foundation, ready for real auth flows later.
            </h1>
            <p className="max-w-xl text-sm leading-7 text-primary-foreground/80 md:text-base">
              This placeholder keeps the auth route distinct from the main shell while staying intentionally free of backend assumptions.
            </p>
          </div>
        </div>
      </section>

      <Card className="h-fit" title="Login placeholder" description="Authentication wiring is intentionally deferred to a later phase.">
        <div className="mb-6 flex items-center justify-between">
          <div className="rounded-full bg-accent p-3 text-accent-foreground">
            <LockKeyhole className="size-5" />
          </div>
          <ThemeToggle />
        </div>

        <PageHeader
          eyebrow="Phase 1 only"
          title="Sign in"
          description="These controls establish layout, spacing, and theming only. No auth requests are being invented here."
          className="mb-6"
        />

        <div className="space-y-4">
          <Input disabled placeholder="Email address" type="email" />
          <Input disabled placeholder="Password" type="password" />
          <Button className="w-full justify-between" disabled size="lg">
            Continue
            <ArrowRight />
          </Button>
          <p className="text-sm leading-6 text-muted-foreground">
            Hook real authentication into this route once backend contracts are available.
          </p>
        </div>
      </Card>
    </div>
  )
}
