import { ArrowUpRight, Briefcase } from 'lucide-react'
import { useLoaderData } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { ContentSections } from '@/components/site/content-article'
import { ProjectCard } from '@/components/site/content-cards'
import { PageContainer, PageHeader } from '@/components/site/page'
import { SmartLink } from '@/components/site/smart-link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { sections } from '@/config/site'
import { projects } from '@/content/projects'
import type { Project } from '@/content/types'

export function ProjectsIndexPage() {
  return (
    <PageContainer className="flex flex-col gap-10 pt-6 pb-section">
      <PageHeader
        eyebrow={sections.projects.title}
        title={sections.projects.heading}
        description={sections.projects.description}
      />
      {projects.length === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          headingLevel="h2"
          title="No case studies yet"
          description="Case studies are published once the work they describe exists."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <li key={project.slug} className="flex">
              <ProjectCard project={project} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}

export function ProjectDetailPage() {
  const project = useLoaderData<Project>()

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
