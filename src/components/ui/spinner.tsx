import { LoaderCircle } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export interface SpinnerProps extends ComponentProps<'span'> {
  /** Announced to screen readers. */
  label?: string
}

/** An indeterminate loading indicator announced as a status. */
export function Spinner({ label = 'Loading', className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      className={cn('inline-flex items-center text-muted-foreground [&_svg]:size-4', className)}
      {...props}
    >
      <LoaderCircle aria-hidden="true" className="animate-spin" />
      <span className="sr-only">{label}</span>
    </span>
  )
}
