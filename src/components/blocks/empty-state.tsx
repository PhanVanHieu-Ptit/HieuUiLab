import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type HeadingTag = 'h2' | 'h3' | 'h4' | 'p'

export interface EmptyStateProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** Decorative icon; hidden from assistive tech. */
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Buttons or links that help the user recover or move on. */
  actions?: ReactNode
  /** Heading level that fits the surrounding document outline. */
  headingLevel?: HeadingTag
}

/** A centered message for empty, unavailable, or not-yet-loaded content. */
export function EmptyState({
  icon,
  title,
  description,
  actions,
  headingLevel: Heading = 'h3',
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center',
        className,
      )}
      {...props}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5"
        >
          {icon}
        </div>
      ) : null}
      <Heading className="font-semibold tracking-tight">{title}</Heading>
      {description ? (
        <p className="max-w-sm text-sm text-pretty text-muted-foreground">{description}</p>
      ) : null}
      {actions ? <div className="mt-3 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  )
}
