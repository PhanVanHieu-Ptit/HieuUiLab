import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { SectionHeader } from '@/components/site/page'
import { Button } from '@/components/ui/button'

interface LandingSectionProps {
  id: string
  title: string
  description?: ReactNode
  /** "See all" link shown beside the heading. */
  more?: { label: string; href: string }
  children: ReactNode
}

/** A landing-page section: anchored h2, optional "see all" link, then content. */
export function LandingSection({ id, title, description, more, children }: LandingSectionProps) {
  return (
    <section aria-labelledby={id} className="flex scroll-mt-24 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <SectionHeader
          id={id}
          title={title}
          anchorLabel={title}
          {...(description ? { description } : {})}
        />
        {more ? (
          <Button asChild variant="ghost" size="sm" className="-mx-2.5">
            <Link to={more.href}>
              {more.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  )
}
