import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

import { TechStackList } from '@/components/landing/tech-stack-list'
import { PageContainer, PageHeader, SectionHeader } from '@/components/site/page'
import { SmartLink } from '@/components/site/smart-link'
import { StatusBadge } from '@/components/site/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { docsNav, sections, siteConfig } from '@/config/site'
import { experiments } from '@/content/experiments'
import { notes } from '@/content/notes'
import { projects } from '@/content/projects'
import { showcaseProjects } from '@/content/showcase-projects'
import { templates } from '@/content/templates'
import { getRegistryEntries } from '@/registry'
import { isImplemented, type RegistryKind, type RegistryStatus } from '@/registry/types'

const linkClass =
  'rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-ring'

/** "3 stable, 1 experimental". Planned entries are not counted; they are listed below. */
function statusSummary(statuses: readonly RegistryStatus[]): string {
  const stable = statuses.filter((status) => status === 'stable').length
  const experimental = statuses.filter((status) => status === 'experimental').length
  return [
    stable ? `${String(stable)} stable` : '',
    experimental ? `${String(experimental)} experimental` : '',
  ]
    .filter(Boolean)
    .join(', ')
}

function implementedInventory(title: string, href: string, kind: RegistryKind) {
  const implemented = getRegistryEntries(kind).filter(isImplemented)
  return {
    title,
    href,
    detail: statusSummary(implemented.map((entry) => entry.status)),
    count: implemented.length,
  }
}

// Counted from the registry and content modules, so the page cannot overstate what exists.
const inventory = [
  implementedInventory('Components', '/components', 'component'),
  implementedInventory('Blocks', '/blocks', 'block'),
  {
    title: 'Templates',
    href: '/templates',
    detail: statusSummary(templates.map((template) => template.status)),
    count: templates.length,
  },
  {
    title: 'Experiments',
    href: '/labs',
    detail: statusSummary(experiments.map((experiment) => experiment.status)),
    count: experiments.length,
  },
  {
    title: 'Projects',
    href: '/projects',
    detail: `${String(showcaseProjects.length)} public, ${String(projects.length)} case studies`,
    count: showcaseProjects.length + projects.length,
  },
  { title: 'Notes', href: '/notes', detail: '', count: notes.length },
]

const planned = docsNav
  .flatMap((section) => section.items)
  .filter((item) => item.status === 'planned')

export function AboutPage() {
  return (
    <PageContainer className="flex flex-col gap-14 pt-6 pb-section">
      <PageHeader
        eyebrow={sections.about.title}
        title={sections.about.heading}
        description={siteConfig.description}
      />

      <section aria-labelledby="what-it-is" className="flex max-w-prose flex-col gap-4">
        <SectionHeader id="what-it-is" title="What it is" anchorLabel="What it is" />
        <p className="leading-7 text-pretty">
          A personal UI registry and frontend engineering lab: reusable React components with live
          previews, copyable source, props documentation, and tests, example apps built from them,
          and experiments with maps and 3D graphics, alongside write-ups of how they were built.
        </p>
        <p className="leading-7 text-pretty">
          There is no package to install. Each entry is a single file you copy into your own
          project; the{' '}
          <Link to="/docs/installation" className={linkClass}>
            installation guide
          </Link>{' '}
          explains what it expects.
        </p>
      </section>

      <section aria-labelledby="whats-here" className="flex flex-col gap-4">
        <SectionHeader id="whats-here" title="What’s here" anchorLabel="What’s here" />
        <dl className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-6">
          {inventory.map((item) => (
            <div key={item.title} className="flex flex-col gap-1 bg-surface p-4">
              <dt className="text-sm text-muted-foreground">
                <Link to={item.href} className="rounded-sm focus-ring hover:underline">
                  {item.title}
                </Link>
              </dt>
              <dd className="text-2xl font-semibold tabular-nums">{item.count}</dd>
              {item.detail ? (
                <dd className="text-xs text-muted-foreground">{item.detail}</dd>
              ) : null}
            </div>
          ))}
        </dl>
      </section>

      {planned.length > 0 ? (
        <section aria-labelledby="planned" className="flex flex-col gap-4">
          <SectionHeader
            id="planned"
            title="Planned"
            anchorLabel="Planned"
            description="Sections and registry entries that are not built yet. Their pages say so rather than showing placeholder content."
          />
          <ul className="flex flex-col divide-y rounded-lg border">
            {planned.map((item) => (
              <li key={item.href} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-4">
                <Link to={item.href} className={linkClass}>
                  {item.title}
                </Link>
                <StatusBadge status="planned" size="sm" />
                {item.description ? (
                  <p className="w-full text-sm text-muted-foreground">{item.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="built-with" className="flex flex-col gap-6">
        <SectionHeader id="built-with" title="Built with" anchorLabel="Built with" />
        <TechStackList />
      </section>

      <section aria-labelledby="source" className="flex flex-col gap-4">
        <SectionHeader
          id="source"
          title="Source and contact"
          anchorLabel="Source and contact"
          description="The lab is built in the open. Questions and suggestions go through GitHub issues."
        />
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Repository', href: siteConfig.githubUrl },
            { label: 'Open an issue', href: siteConfig.issuesUrl },
            { label: 'GitHub profile', href: siteConfig.githubProfileUrl },
          ].map((link) => (
            <SmartLink
              key={link.href}
              href={link.href}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {link.label}
              <ArrowUpRight aria-hidden="true" />
            </SmartLink>
          ))}
        </div>
      </section>
    </PageContainer>
  )
}
