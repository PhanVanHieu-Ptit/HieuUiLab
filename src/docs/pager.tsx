import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

import type { DocNode } from './manifest'

const linkClass =
  'flex flex-col gap-1 rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground focus-ring'

/** Links to the pages before and after this one in reading order. */
export function Pager({ previous, next }: { previous?: DocNode; next?: DocNode }) {
  if (!previous && !next) return null
  return (
    <nav aria-label="Docs pager" className="grid gap-3 border-t pt-6 sm:grid-cols-2">
      {previous ? (
        <Link to={previous.href} rel="prev" className={linkClass}>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            Previous
          </span>
          <span className="font-medium">{previous.entry.title}</span>
        </Link>
      ) : null}
      {next ? (
        <Link to={next.href} rel="next" className={`${linkClass} sm:col-start-2 sm:text-right`}>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground sm:justify-end">
            Next
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </span>
          <span className="font-medium">{next.entry.title}</span>
        </Link>
      ) : null}
    </nav>
  )
}
