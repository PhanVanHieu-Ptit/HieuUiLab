import { FlaskConical } from 'lucide-react'
import { Suspense } from 'react'
import { useParams } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { ContentSections } from '@/components/site/content-article'
import { ExperimentCard } from '@/components/site/content-cards'
import { CrumbTrail } from '@/components/site/crumb-trail'
import { DemoErrorBoundary } from '@/components/site/demo-error-boundary'
import { PageContainer, PageHeader, SectionHeader } from '@/components/site/page'
import { StatusBadge } from '@/components/site/status-badge'
import { Spinner } from '@/components/ui/spinner'
import { experimentKindLabel, experiments, getExperiment } from '@/content/experiments'
import { labDemos } from '@/lab'

import { NotFoundContent } from './not-found-page'

export function LabIndexPage() {
  return (
    <PageContainer className="flex flex-col gap-10 py-section">
      <PageHeader
        eyebrow="Lab"
        title="Geospatial and 3D experiments"
        description="Small, working experiments with maps and graphics, written from first principles. Each one runs in the page, respects reduced motion, and explains how it works."
      />
      {experiments.length === 0 ? (
        <EmptyState
          icon={<FlaskConical />}
          headingLevel="h2"
          title="No experiments yet"
          description="Experiments appear here once they run in the browser."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {experiments.map((experiment) => (
            <li key={experiment.slug} className="flex">
              <ExperimentCard experiment={experiment} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}

function DemoFallback() {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted/40">
      <Spinner label="Loading experiment" />
    </div>
  )
}

export function LabDetailPage() {
  const { slug = '' } = useParams()
  const experiment = getExperiment(slug)
  if (!experiment) {
    return (
      <PageContainer>
        <NotFoundContent />
      </PageContainer>
    )
  }

  const Demo = labDemos[experiment.slug]

  return (
    <PageContainer className="py-section">
      <CrumbTrail
        crumbs={[{ title: 'Lab', href: '/lab' }, { title: experiment.title }]}
        className="mb-6"
      />
      <article className="flex flex-col gap-12">
        <PageHeader
          eyebrow={experimentKindLabel[experiment.kind]}
          title={experiment.title}
          meta={<StatusBadge status={experiment.status} />}
          description={experiment.summary}
        />

        <section aria-labelledby="demo" className="flex flex-col gap-4">
          <SectionHeader id="demo" title="Live demo" anchorLabel="Live demo" />
          {Demo ? (
            <DemoErrorBoundary>
              <Suspense fallback={<DemoFallback />}>
                <Demo />
              </Suspense>
            </DemoErrorBoundary>
          ) : (
            <EmptyState
              icon={<FlaskConical />}
              title="Demo not available yet"
              description="This experiment is documented but its interactive demo has not been built."
            />
          )}
        </section>

        <section aria-labelledby="demonstrates" className="flex flex-col gap-4">
          <SectionHeader id="demonstrates" title="What it shows" anchorLabel="What it shows" />
          <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5 marker:text-muted-foreground">
            {experiment.capabilities.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        </section>

        <ContentSections sections={experiment.body} />
      </article>
    </PageContainer>
  )
}
