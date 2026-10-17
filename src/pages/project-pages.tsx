import { ArrowUpRight, Briefcase } from 'lucide-react'
import { useLoaderData } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { PublicProjectNote } from '@/components/showcase/public-project-note'
import { ShowcaseDetail } from '@/components/showcase/showcase-detail'
import { ContentSections } from '@/components/site/content-article'
import { ProjectCard, ShowcaseProjectCard } from '@/components/site/content-cards'
import { PageContainer, PageHeader, SectionHeader } from '@/components/site/page'
import { SmartLink } from '@/components/site/smart-link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { sections } from '@/config/site'
import type { ProjectEntry } from '@/content/project-entries'
import { projects } from '@/content/projects'
import { showcaseProjects } from '@/content/showcase-projects'
import type { Project } from '@/content/types'

export function ProjectsIndexPage() {
  return (
    <PageContainer className="flex flex-col gap-12 pt-6 pb-section">
      <PageHeader
        eyebrow={sections.projects.title}
        title={sections.projects.heading}
        description={sections.projects.description}
      />
      <PublicProjectNote />

      <section aria-labelledby="projects" className="flex flex-col gap-4">
        <SectionHeader
          id="projects"
          title="Projects"
          anchorLabel="Projects"
          description="What each one set out to solve, how it is built, and where it falls short, with live demos and links to the source."
        />
        {showcaseProjects.length === 0 ? (
          <EmptyState
            icon={<Briefcase />}
            title="No projects yet"
            description="Projects are published once their source and demos are public."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {showcaseProjects.map((project) => (
              <li key={project.slug} className="flex">
                <ShowcaseProjectCard project={project} headingLevel="h3" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="case-studies" className="flex flex-col gap-4">
        <SectionHeader
          id="case-studies"
          title="Engineering case studies"
          anchorLabel="Engineering case studies"
          description="Deeper looks at parts of this lab: the context, the approach, and the trade-offs that remain."
        />
        {projects.length === 0 ? (
          <EmptyState
            icon={<Briefcase />}
            title="No case studies yet"
            description="Case studies are published once the work they describe exists."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <li key={project.slug} className="flex">
                <ProjectCard project={project} headingLevel="h3" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  )
}

function CaseStudyDetail({ project }: { project: Project }) {
  return (
    <PageContainer className="pt-6 pb-section">
      <article className="flex flex-col gap-12">
        <PageHeader
          eyebrow="Case study"
          title={project.title}
          description={project.summary}
          actions={project.links.map((link) => (
            <SmartLink
              key={link.href}
              href={link.href}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {link.label}
              {link.href.startsWith('/') ? null : <ArrowUpRight aria-hidden="true" />}
            </SmartLink>
          ))}
        />

        <dl className="grid gap-5 rounded-lg border bg-surface p-5 text-surface-foreground sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Role</dt>
            <dd className="font-medium">{project.role}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm text-muted-foreground">Period</dt>
            <dd className="font-medium">{project.period}</dd>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Stack</dt>
            <dd className="flex flex-wrap gap-1.5">
              {project.stack.map((item) => (
                <Badge key={item} size="sm">
                  {item}
                </Badge>
              ))}
            </dd>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Outcome</dt>
            <dd className="max-w-prose text-pretty">{project.outcome}</dd>
          </div>
        </dl>

        <ContentSections sections={project.body} />
      </article>
    </PageContainer>
  )
}

export function ProjectDetailPage() {
  const entry = useLoaderData<ProjectEntry>()

  return entry.kind === 'showcase' ? (
    <PageContainer className="pt-6 pb-section">
      <ShowcaseDetail project={entry.project} />
    </PageContainer>
  ) : (
    <CaseStudyDetail project={entry.project} />
  )
}
