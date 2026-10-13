import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export const badgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1 rounded-full border font-medium whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        neutral: 'border-transparent bg-muted text-muted-foreground',
        primary: 'border-transparent bg-primary-subtle text-primary-subtle-foreground',
        outline: 'text-foreground',
        success: 'border-success/40 text-success',
        warning: 'border-warning/40 text-warning',
        info: 'border-info/40 text-info',
        destructive: 'border-destructive/40 text-destructive',
      },
      size: {
        sm: 'h-5 px-1.5 text-xs',
        md: 'h-6 px-2.5 text-xs',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  },
)

export interface BadgeProps extends ComponentProps<'span'>, VariantProps<typeof badgeVariants> {}

/** A short, non-interactive label for status, counts, or metadata. */
export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}
