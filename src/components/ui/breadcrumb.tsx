import { ChevronRight } from 'lucide-react'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

export function Breadcrumb({
  'aria-label': label = 'Breadcrumb',
  ...props
}: ComponentProps<'nav'>) {
  return <nav aria-label={label} {...props} />
}

export function BreadcrumbList({ className, ...props }: ComponentProps<'ol'>) {
  return (
    <ol
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<'li'>) {
  return <li className={cn('inline-flex min-w-0 items-center gap-1.5', className)} {...props} />
}

export interface BreadcrumbLinkProps extends ComponentProps<'a'> {
  /** Merge onto a child element, e.g. a router Link. */
  asChild?: boolean
}

export function BreadcrumbLink({ asChild = false, className, ...props }: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot.Root : 'a'
  return (
    <Comp
      className={cn('rounded-sm focus-ring transition-colors hover:text-foreground', className)}
      {...props}
    />
  )
}

/** The current page: not a link, announced with aria-current. */
export function BreadcrumbPage({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      aria-current="page"
      className={cn('truncate font-medium text-foreground', className)}
      {...props}
    />
  )
}

export function BreadcrumbSeparator({ className, children, ...props }: ComponentProps<'li'>) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('text-muted-foreground/70 [&_svg]:size-3.5', className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}
