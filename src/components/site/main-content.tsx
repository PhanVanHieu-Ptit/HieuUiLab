import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

/** The single `main` landmark; the skip link targets its id. */
export function MainContent({ className, ...props }: ComponentProps<'main'>) {
  return <main id="main" tabIndex={-1} className={cn('outline-none', className)} {...props} />
}
