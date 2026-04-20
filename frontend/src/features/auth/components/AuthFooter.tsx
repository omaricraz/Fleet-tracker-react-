const footerLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Trust Center', href: '#' },
  { label: 'System Status', href: '#' },
] as const

export function AuthFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border/70 bg-muted/30 dark:border-border dark:bg-primary/20">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-5 md:flex-row md:px-8 md:py-6">
        <p className="text-center text-sm tracking-wide text-muted-foreground md:text-left">
          © 2024 Fleet Tracker. Precision in motion.
        </p>
        <nav aria-label="Legal and status" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => e.preventDefault()}
              className="text-sm tracking-wide text-muted-foreground transition-colors hover:text-primary dark:hover:text-primary-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
