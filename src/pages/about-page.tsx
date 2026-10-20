import { Link } from 'react-router'

import { DomainCard } from '@/components/about/domain-card'
import { GoalList } from '@/components/about/goal-list'
import { ProfileLinkButtons } from '@/components/about/profile-links'
import { LandingSection } from '@/components/landing/landing-section'
import { TechStackList } from '@/components/landing/tech-stack-list'
import { NoteCard, ShowcaseProjectCard } from '@/components/site/content-cards'
import { PageContainer, PageHeader, SectionHeader } from '@/components/site/page'
import { StatusBadge } from '@/components/site/status-badge'
import { docsNav, flattenNavItems, sections } from '@/config/site'
import { experiments } from '@/content/experiments'
import { featuredShowcaseSlugs, recentNotesCount } from '@/content/landing'
import { contactLinks, profile, profileLinks } from '@/content/profile'
import { projects } from '@/content/projects'
import { getShowcaseProject, showcaseProjects } from '@/content/showcase-projects'
import type { ShowcaseProject } from '@/content/showcase-types'
import { templates } from '@/content/templates'
import { notes } from '@/notes/manifest'
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

const planned = flattenNavItems(docsNav.flatMap((section) => section.items)).filter(
  (item) => item.status === 'planned',
)

export function AboutPage() {
  const featuredProjects = featuredShowcaseSlugs
    .map((slug) => getShowcaseProject(slug))
    .filter((project): project is ShowcaseProject => project !== undefined)
  const recentNotes = notes.slice(0, recentNotesCount)

  return (
    <PageContainer className="flex flex-col gap-14 pt-6 pb-section">
      <PageHeader
        eyebrow={sections.about.title}
        title={sections.about.heading}
        description={profile.headline}
        actions={<ProfileLinkButtons links={contactLinks()} />}
      />

      <section aria-label="Introduction" className="flex max-w-prose flex-col gap-4">
        {profile.intro.map((paragraph) => (
          <p key={paragraph} className="leading-7 text-pretty">
            {paragraph}
          </p>
        ))}
      </section>

      <section aria-labelledby="skills" className="flex scroll-mt-24 flex-col gap-6">
        <SectionHeader
          id="skills"
          title="Skills by engineering domain"
          anchorLabel="Skills by engineering domain"
          description="What this repository shows in each area, with the code, projects, and notes behind it. There are no ratings: the evidence is the claim."
        />
        <ul className="grid gap-4 md:grid-cols-2">
          {profile.domains.map((domain) => (
            <li key={domain.id} className="flex">
              <DomainCard domain={domain} />
            </li>
          ))}
        </ul>
      </section>

      <LandingSection
        id="projects"
        title="Public projects"
        description="Each one lists its source, its decisions, and its known limits."
        more={{ label: 'All projects', href: '/projects' }}
      >
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredProjects.map((project) => (
            <li key={project.slug} className="flex">
              <ShowcaseProjectCard project={project} />
            </li>
          ))}
        </ul>
      </LandingSection>

      <LandingSection
        id="notes"
        title="Recent engineering notes"
        description="Each article says how its claims were checked and what was not."
        more={{ label: 'All notes', href: '/notes' }}
      >
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentNotes.map((note) => (
            <li key={note.slug} className="flex">
              <NoteCard note={note} />
            </li>
          ))}
        </ul>
      </LandingSection>

      <section aria-labelledby="learning-goals" className="flex scroll-mt-24 flex-col gap-6">
        <SectionHeader
          id="learning-goals"
          title="Learning goals, not achievements"
          anchorLabel="Learning goals"
          description="Things still to learn. None is claimed as experience, and each says what this repository has today."
        />
        <GoalList goals={profile.goals} />
      </section>

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
          description="The lab is built in the open. The source, its history, and the issue tracker are on GitHub."
        />
        <div className="flex flex-wrap gap-3">
          <ProfileLinkButtons links={profileLinks()} />
        </div>
      </section>
    </PageContainer>
  )
}
