import { useId } from 'react'

import { cn } from '@/lib/cn'

import { SITE_CATEGORIES, SITE_CATEGORY_LABELS, type SiteCategory } from './data'

// The same tokens and relative sizes as the markers in `map-style.ts` and `theme-colors.ts`.
const CATEGORY_SWATCH: Readonly<Record<SiteCategory, string>> = {
  harbour: 'size-5 bg-info',
  depot: 'size-4 bg-warning',
  lookout: 'size-3 bg-success',
  station: 'size-3.5 bg-foreground',
}

/** What the symbols on the map mean. Category is shown by size as well as colour. */
export function Legend() {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-lg border p-4">
      <h3 id={headingId} className="text-sm font-semibold">
        Legend
      </h3>
      <ul className="flex flex-col gap-2 text-sm">
        {SITE_CATEGORIES.map((category) => (
          <li key={category} className="flex items-center gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
              <span
                className={cn('rounded-full ring-2 ring-background', CATEGORY_SWATCH[category])}
              />
            </span>
            <span>{SITE_CATEGORY_LABELS[category]}</span>
          </li>
        ))}
        <li className="flex items-center gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
            <span className="h-0.5 w-6 rounded-full bg-primary" />
          </span>
          <span>Service route</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
            <span className="size-5 rounded-sm border border-dashed border-foreground/50 bg-foreground/10" />
          </span>
          <span>Service zone</span>
        </li>
      </ul>
    </section>
  )
}
