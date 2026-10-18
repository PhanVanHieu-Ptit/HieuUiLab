import type { ReactNode } from 'react'

import { useScrollOverflow } from '@/hooks/use-scroll-overflow'
import { cn } from '@/lib/cn'

interface ScrollRegionProps {
  /** Names the region while it scrolls, e.g. "Props of Button, scrollable". */
  label: string
  /** Set the overflow rule here (`overflow-x-auto`, `max-h-128 overflow-auto`, ...). */
  className?: string
  /** One element whose size follows its content, so a change in content is noticed. */
  children: ReactNode
}

/**
 * A scroll container that can be scrolled with the keyboard. It becomes a focusable, named
 * region only while its content overflows (WCAG 2.1.1), so it adds no tab stop otherwise.
 */
export function ScrollRegion({ label, className, children }: ScrollRegionProps) {
  const [ref, overflowing] = useScrollOverflow<HTMLDivElement>()
  return (
    <div
      ref={ref}
      {...(overflowing ? { role: 'region', 'aria-label': label, tabIndex: 0 } : {})}
      className={cn('focus-ring', className)}
    >
      {children}
    </div>
  )
}
