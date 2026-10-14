import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-lg border px-4 py-3 text-sm text-foreground has-[>svg]:grid-cols-[--spacing(4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5',
  {
    variants: {
      variant: {
        neutral: '[&>svg]:text-muted-foreground',
        info: 'border-info/40 [&>[data-slot=alert-title]]:text-info [&>svg]:text-info',
        success: 'border-success/40 [&>[data-slot=alert-title]]:text-success [&>svg]:text-success',
        warning: 'border-warning/40 [&>[data-slot=alert-title]]:text-warning [&>svg]:text-warning',
        destructive:
          'border-destructive/40 [&>[data-slot=alert-title]]:text-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

export interface AlertProps extends ComponentProps<'div'>, VariantProps<typeof alertVariants> {}

/**
 * A static message about the page or a task. Defaults to `role="status"`
 * (announced politely when it appears) and `role="alert"` for `destructive`
 * (announced at once, interrupting). Pass `role="none"` for messages present on
 * load that should not be announced. The title names the status in words, so
 * colour is never the only signal.
 */
export function Alert({ className, variant, role, ...props }: AlertProps) {
  return (
    <div
      role={role ?? (variant === 'destructive' ? 'alert' : 'status')}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

export function AlertTitle({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="alert-title"
      className={cn('col-start-2 leading-5 font-medium', className)}
      {...props}
    />
  )
}

export function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('col-start-2 text-muted-foreground [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
}
