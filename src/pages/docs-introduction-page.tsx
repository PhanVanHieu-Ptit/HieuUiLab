import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

import { CodeBlock } from '@/components/site/code-block'
import { PageHeader, SectionHeader } from '@/components/site/page'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'

const structure = `src/
  components/
    ui/        # registry components: the copyable source
    site/      # app shell and docs UI (not part of the registry)
  config/
    site.ts    # navigation, used by header, sidebar, drawer, search, breadcrumbs
  registry/    # one folder per entry: demos.tsx + meta.ts
  styles/
    globals.css  # semantic tokens, themes, shared state utilities`

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

      <section aria-labelledby="structure" className="flex flex-col gap-4">
        <SectionHeader id="structure" title="Project structure" anchorLabel="Project structure" />
        <CodeBlock code={structure} language="text" title="tree" />
      </section>
    </article>
  )
}
