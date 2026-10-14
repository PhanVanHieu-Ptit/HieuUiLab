import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

import { PageHeader, SectionHeader } from '@/components/site/page'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'

const proseLink =
  'rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-ring'

export function DocsIntroductionPage() {
  return (
    <article className="flex flex-col gap-12">
      <PageHeader
        eyebrow="Getting started"
        title="Introduction"
        description={siteConfig.description}
        actions={
          <Button asChild>
            <Link to="/components">
              Browse components
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="how-it-works" className="flex max-w-prose flex-col gap-4">
        <SectionHeader id="how-it-works" title="How it works" anchorLabel="How it works" />
        <p className="text-pretty">
          Each registry entry is a single component file plus a page with live demos, the full
          source, its npm dependencies, and a props reference. There is no package to install: copy
          the file into your project and adapt it.
        </p>
        <p className="text-pretty">
          Components style themselves only through semantic tokens such as{' '}
          <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">bg-surface</code> and
          shared state utilities such as{' '}
          <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-xs">focus-ring</code>, so
          they follow your theme. See{' '}
          <Link to="/docs/theming" className={proseLink}>
            Theming
          </Link>{' '}
          for the full list.
        </p>
      </section>

      <section aria-labelledby="next-steps" className="flex max-w-prose flex-col gap-4">
        <SectionHeader id="next-steps" title="Next steps" anchorLabel="Next steps" />
        <p className="text-pretty">
          <Link to="/docs/installation" className={proseLink}>
            Installation
          </Link>{' '}
          covers what a copied entry expects in your project.{' '}
          <Link to="/docs/architecture" className={proseLink}>
            Architecture
          </Link>{' '}
          explains how this site is organised: the registry, routing, and code splitting.
        </p>
      </section>
    </article>
  )
}
