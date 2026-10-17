import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

import { PageHeader, SectionHeader } from '@/components/site/page'
import { SmartLink } from '@/components/site/smart-link'
import { Badge } from '@/components/ui/badge'
import { getProject } from '@/content/projects'
import {
  repositoryFileUrl,
  repositoryName,
  showcaseCategoryLabels,
  visibilityLabel,
  type EvidenceRef,
  type ShowcaseProject,
} from '@/content/showcase-types'
import { formatDate } from '@/lib/format-date'

import { PublicProjectNote } from './public-project-note'
import { mediaHeading } from './media-heading'
import { ShowcaseMediaList } from './showcase-media'

const proseLink = 'rounded-sm font-medium text-foreground underline underline-offset-4 focus-ring'
const inlineCode = 'rounded-sm bg-muted px-1 py-0.5 font-mono text-xs'
const bulletList =
  'flex max-w-prose list-disc flex-col gap-2 pl-5 text-pretty marker:text-muted-foreground'

function Facts({ project }: { project: ShowcaseProject }) {
  return (
    <dl className="grid gap-5 rounded-lg border bg-surface p-5 text-surface-foreground sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <dt className="text-sm text-muted-foreground">Visibility</dt>
        <dd className="font-medium">{visibilityLabel[project.visibility]}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-sm text-muted-foreground">Kind</dt>
        <dd className="font-medium">{showcaseCategoryLabels[project.category]}</dd>
      </div>
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
    </dl>
  )
}

function Evidence({ project, items }: { project: ShowcaseProject; items: readonly EvidenceRef[] }) {
  return (
    <ul aria-label="Evidence" className="flex flex-col gap-1.5 text-sm">
      {items.map((item) => (
        <li key={`${item.path}-${item.label}`}>
          <SmartLink href={repositoryFileUrl(project.repository, item.path)} className={proseLink}>
            {item.label}
          </SmartLink>{' '}
          <code className={inlineCode}>{item.path}</code>
        </li>
      ))}
    </ul>
  )
}

function RepositoryAndDeployment({ project }: { project: ShowcaseProject }) {
  const { repository, deployment } = project
  return (
    <dl className="grid max-w-2xl gap-5 rounded-lg border bg-surface p-5 text-surface-foreground">
      <div className="flex flex-col gap-1">
        <dt className="text-sm text-muted-foreground">Repository</dt>
        <dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <SmartLink href={repository.url} className={proseLink}>
            {repositoryName(repository)}
            <ArrowUpRight aria-hidden="true" className="ml-1 inline size-3.5" />
          </SmartLink>
          <span className="text-sm text-muted-foreground">
            Confirmed public {formatDate(repository.verifiedOn)}
          </span>
        </dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="text-sm text-muted-foreground">Deployment</dt>
        <dd className="flex flex-col gap-1">
          {deployment.status === 'live' ? (
            <>
              <SmartLink href={deployment.url} className={proseLink}>
                {new URL(deployment.url).host}
                <ArrowUpRight aria-hidden="true" className="ml-1 inline size-3.5" />
              </SmartLink>
              <span className="text-sm text-muted-foreground">
                Link checked {formatDate(deployment.verifiedOn)}
              </span>
            </>
          ) : (
            <>
              <span className="font-medium">Not deployed yet</span>
              <span className="max-w-prose text-sm text-muted-foreground">
                There is no public demo URL. The live demos on this page run inside this site.
              </span>
            </>
          )}
        </dd>
      </div>
    </dl>
  )
}

/** The page for one public project. Sections follow the order a reader asks questions in. */
export function ShowcaseDetail({ project }: { project: ShowcaseProject }) {
  const related = (project.relatedCaseStudies ?? [])
    .map((slug) => getProject(slug))
    .filter((study) => study !== undefined)

  return (
    <article className="flex flex-col gap-14">
      <PageHeader
        eyebrow="Project"
        title={project.title}
        description={project.summary}
        meta={
          <Badge variant="outline" size="md">
            {visibilityLabel[project.visibility]}
          </Badge>
        }
      />

      <Facts project={project} />

      <section aria-labelledby="problem" className="flex flex-col gap-4">
        <SectionHeader id="problem" title="Problem" anchorLabel="Problem" />
        {project.problem.map((paragraph) => (
          <p key={paragraph} className="max-w-prose leading-7 text-pretty">
            {paragraph}
          </p>
        ))}
      </section>

      <section aria-labelledby="scope" className="flex flex-col gap-4">
        <SectionHeader id="scope" title="Scope and role" anchorLabel="Scope and role" />
        <p className="max-w-prose leading-7 text-pretty">
          <span className="font-medium">{project.role}.</span> {project.scope.summary}
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Included</h3>
            <ul aria-label="Included" className={bulletList}>
              {project.scope.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Not included</h3>
            <ul aria-label="Not included" className={bulletList}>
              {project.scope.excludes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="decisions" className="flex flex-col gap-4">
        <SectionHeader
          id="decisions"
          title="Technical decisions"
          anchorLabel="Technical decisions"
        />
        <ul className="flex flex-col gap-6">
          {project.decisions.map((decision) => (
            <li key={decision.title} className="flex max-w-prose flex-col gap-1.5">
              <h3 className="font-semibold">{decision.title}</h3>
              <p className="leading-7 text-pretty">{decision.rationale}</p>
              <p className="text-sm text-pretty text-muted-foreground">
                <span className="font-medium text-foreground">Trade-off:</span> {decision.tradeoff}
              </p>
            </li>
          ))}
        </ul>
        {related.length > 0 ? (
          <p className="max-w-prose text-sm text-muted-foreground">
            Deeper look:{' '}
            {related.map((study, index) => (
              <span key={study.slug}>
                {index > 0 ? ', ' : null}
                <Link to={`/projects/${study.slug}`} className={proseLink}>
                  {study.title}
                </Link>
              </span>
            ))}
            .
          </p>
        ) : null}
      </section>

      <section aria-labelledby="architecture" className="flex flex-col gap-4">
        <SectionHeader
          id="architecture"
          title="Architecture overview"
          anchorLabel="Architecture overview"
        />
        <p className="max-w-prose leading-7 text-pretty">{project.architecture.summary}</p>
        <ul aria-label="Parts" className="grid gap-3 sm:grid-cols-2">
          {project.architecture.parts.map((part) => (
            <li
              key={part.name}
              className="flex flex-col gap-1 rounded-lg border bg-surface p-4 text-surface-foreground"
            >
              <h3 className="font-semibold">{part.name}</h3>
              <p className="text-sm text-muted-foreground">{part.responsibility}</p>
              <p className="text-xs">
                <SmartLink
                  href={repositoryFileUrl(project.repository, part.path)}
                  className={proseLink}
                >
                  <code className={inlineCode}>{part.path}</code>
                </SmartLink>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="challenges" className="flex flex-col gap-4">
        <SectionHeader
          id="challenges"
          title="Challenges and verified solutions"
          anchorLabel="Challenges and verified solutions"
          description="Each solution links to the files that show it works: the code, a test, or the CI workflow."
        />
        <ul className="flex flex-col gap-8">
          {project.challenges.map((item) => (
            <li key={item.challenge} className="flex max-w-prose flex-col gap-2">
              <h3 className="font-semibold text-balance">{item.challenge}</h3>
              <p className="leading-7 text-pretty">{item.solution}</p>
              <Evidence project={project} items={item.evidence} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="demos" className="flex flex-col gap-6">
        <SectionHeader
          id="demos"
          title={mediaHeading(project.media)}
          anchorLabel={mediaHeading(project.media)}
        />
        <ShowcaseMediaList media={project.media} />
      </section>

      <section aria-labelledby="repository" className="flex flex-col gap-4">
        <SectionHeader
          id="repository"
          title="Repository and deployment"
          anchorLabel="Repository and deployment"
        />
        <RepositoryAndDeployment project={project} />
      </section>

      <section aria-labelledby="limits" className="flex flex-col gap-6">
        <SectionHeader
          id="limits"
          title="Known limitations and future improvements"
          anchorLabel="Known limitations and future improvements"
        />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold">Known limitations</h3>
            <ul aria-label="Known limitations" className={bulletList}>
              {project.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold">Future improvements</h3>
            <p className="max-w-prose text-sm text-muted-foreground">
              Ideas for what to do next. None is promised or scheduled.
            </p>
            <ul aria-label="Future improvements" className={bulletList}>
              {project.improvements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <PublicProjectNote headingLevel="h2" />
    </article>
  )
}
