import { Badge, type BadgeProps } from '@/components/ui/badge'

type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

interface StatusBadgeProps {
  label: string
  tone?: StatusTone
}

const toneMap: Record<StatusTone, BadgeProps['variant']> = {
  neutral: 'secondary',
  info: 'default',
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
}

export function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return <Badge variant={toneMap[tone]}>{label}</Badge>
}
