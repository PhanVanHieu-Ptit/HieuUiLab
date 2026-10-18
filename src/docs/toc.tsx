import { cn } from '@/lib/cn'

import type { DocHeading } from './markdown'

/** The fewest entries worth a table of contents. */
const MIN_ENTRIES = 3

interface TocProps {
  headings: readonly DocHeading[]
  className?: string
}

/**
 * "On this page": links to the page's h2 and h3 headings. One element for every width; the page
 * places it in a sticky column on wide screens and above the text on narrow ones. It is left out
 * of short pages, where it would be longer than the page is tall.
 */
export function Toc({ headings, className }: TocProps) {
  const entries = headings.filter((heading) => heading.depth <= 3)
  if (entries.length < MIN_ENTRIES) return null
  return (
    <nav
      aria-label="On this page"
      className={cn(
        'xl:sticky xl:top-[calc(var(--spacing-header)+1.5rem)] xl:max-h-[calc(100dvh-var(--spacing-header)-3rem)] xl:overflow-y-auto',
        className,
      )}
    >
      <p className="mb-2 text-xs font-semibold tracking-wide text-foreground uppercase">
        On this page
      </p>
      <ul className="flex flex-col border-l text-sm">
        {entries.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                'block rounded-sm py-1 pr-2 text-muted-foreground focus-ring-inset hover:text-foreground',
                heading.depth === 3 ? 'pl-6' : 'pl-3',
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
