import type { ReactNode } from 'react'

import {
  Card as BaseCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CardProps {
  title?: string
  description?: string
  accent?: 'primary' | 'secondary' | 'warning' | 'success'
  className?: string
  contentClassName?: string
  footer?: ReactNode
  children: ReactNode
}

const accentClasses = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  warning: 'bg-warning',
  success: 'bg-success',
}

export function Card({
  title,
  description,
  accent = 'primary',
  className,
  contentClassName,
  footer,
  children,
}: CardProps) {
  return (
    <BaseCard className={cn('relative overflow-hidden', className)}>
      <div className={cn('absolute inset-y-6 left-0 w-1 rounded-r-full', accentClasses[accent])} />
      {(title || description) && (
        <CardHeader className="pl-7">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      )}
      <CardContent className={cn(title || description ? 'pl-7' : 'pt-6 pl-7', contentClassName)}>
        {children}
      </CardContent>
      {footer ? <CardFooter className="pl-7">{footer}</CardFooter> : null}
    </BaseCard>
  )
}
