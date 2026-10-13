import { Hash } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/cn'

/** Centered, gutter-padded column for pages outside the docs layout. */
export function PageContainer({
  size = 'content',
  className,
  ...props
}: ComponentProps<'div'> & { size?: 'content' | 'page' | 'prose' }) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-gutter',
        size === 'page' && 'max-w-page',
        size === 'content' && 'max-w-content',
        size === 'prose' && 'max-w-prose',
        className,
      )}
      {...props}
    />
  )
}

interface PageHeaderProps {
  title: ReactNode
  /** Small label above the title, e.g. a category. */
  eyebrow?: ReactNode
  description?: ReactNode
  /** Inline elements after the title, e.g. a status badge. */
  meta?: ReactNode
  /** Buttons or links below the description. */
  actions?: ReactNode
  className?: string
}

/** The page's h1 block. Use once per page. */
export function PageHeader({
  title,
  eyebrow,
  description,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-3', className)}>
      {eyebrow ? <p className="font-mono text-xs font-medium text-primary">{eyebrow}</p> : null}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="text-title text-balance">{title}</h1>
        {meta}
      </div>
      {description ? (
        <p className="max-w-prose text-base text-pretty text-muted-foreground">{description}</p>
      ) : null}
      {actions ? <div className="mt-2 flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  )
}

interface SectionHeaderProps {
  /** Anchor id; also the target of the hover "#" link. */
  id: string
  title: ReactNode
  description?: ReactNode
  /** Accessible name of the anchor link, e.g. "Installation". */
  anchorLabel: string
  className?: string
}

/** An anchored h2 with an optional description. */
export function SectionHeader({
  id,
  title,
  description,
  anchorLabel,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="group flex items-center gap-1.5">
        <h2 id={id} className="text-heading">
          {title}
        </h2>
        <a
          href={`#${id}`}
          aria-label={`Link to section: ${anchorLabel}`}
          className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground opacity-0 focus-ring transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
        >
          <Hash aria-hidden="true" className="size-4" />
        </a>
      </div>
      {description ? (
        <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
