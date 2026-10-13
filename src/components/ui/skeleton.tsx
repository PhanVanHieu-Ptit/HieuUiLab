import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

/**
 * A placeholder block shown while content loads. Hidden from assistive tech;
 * announce loading on the region instead (aria-busy or a Spinner).
 */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}
