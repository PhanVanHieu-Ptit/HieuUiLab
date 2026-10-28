import type { ReactNode } from 'react'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'destructive'

const toneVariant = {
  neutral: 'neutral',
  info: 'info',
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
} as const satisfies Record<StatusTone, BadgeProps['variant']>

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  tone?: StatusTone
  /** The status in words, e.g. "Shipped". Required: color alone never carries the meaning. */
  children: ReactNode
}

/**
 * A Badge for the state of a record. Map each domain status to one tone and
 * keep the mapping in one place. The dot is decorative; the text is the status.
 */
export function StatusBadge({ tone = 'neutral', className, children, ...props }: StatusBadgeProps) {
  return (
    <Badge variant={toneVariant[tone]} className={cn('gap-1.5', className)} {...props}>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </Badge>
  )
}
