import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

/** A keyboard key or shortcut hint. */
export function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-sm border bg-muted px-1 font-mono text-xs leading-none font-medium text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}
