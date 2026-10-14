import { FlaskConical } from 'lucide-react'
import { Suspense } from 'react'
import { useLoaderData, useRouteLoaderData } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { LandingSection } from '@/components/landing/landing-section'
import { ContentSections } from '@/components/site/content-article'
import { ExperimentCard } from '@/components/site/content-cards'
import { DemoErrorBoundary } from '@/components/site/demo-error-boundary'
import { PageContainer, PageHeader, SectionHeader } from '@/components/site/page'
import { StatusBadge } from '@/components/site/status-badge'
import { Spinner } from '@/components/ui/spinner'
import { sections } from '@/config/site'
import {
  experimentKindHref,
  experimentKinds,
  getExperimentsOfKind,
  type ExperimentKindInfo,
} from '@/content/experiments'
import type { Experiment } from '@/content/types'
import { labDemos } from '@/lab'
import { LAB_KIND_ROUTE_ID } from '@/router/loaders'

function ExperimentList({
  experiments,
  headingLevel,
}: {
  experiments: readonly Experiment[]
  headingLevel: 'h2' | 'h3'
}) {
  if (experiments.length === 0) {
    return (
      <EmptyState
        icon={<FlaskConical />}
        headingLevel={headingLevel}
        title="No experiments yet"
        description="Experiments appear here once they run in the browser."
      />
    )
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {experiments.map((experiment) => (
        <li key={experiment.slug} className="flex">
          <ExperimentCard experiment={experiment} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  )
}

export function LabIndexPage() {
  return (
    <PageContainer className="flex flex-col gap-12 pt-6 pb-section">
      <PageHeader
        eyebrow={sections.labs.title}
        title={sections.labs.heading}
        description={sections.labs.description}
      />
      {Object.values(experimentKinds).map((kind) => (
        <LandingSection
          key={kind.kind}
          id={`kind-${kind.path}`}
          title={kind.title}
          description={kind.description}
          more={{ label: `All ${kind.title} experiments`, href: experimentKindHref(kind.path) }}
        >
          <ExperimentList experiments={getExperimentsOfKind(kind.kind)} headingLevel="h3" />
        </LandingSection>
      ))}
    </PageContainer>
  )
}

export function LabCategoryPage() {
  const kind = useRouteLoaderData<ExperimentKindInfo>(LAB_KIND_ROUTE_ID)
  if (!kind) return null

  return (
    <PageContainer className="flex flex-col gap-10 pt-6 pb-section">
      <PageHeader eyebrow={sections.labs.title} title={kind.title} description={kind.description} />
      <ExperimentList experiments={getExperimentsOfKind(kind.kind)} headingLevel="h2" />
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
  const experiment = useLoaderData<Experiment>()
  const Demo = labDemos[experiment.slug]

  return (
    <PageContainer className="pt-6 pb-section">
      <article className="flex flex-col gap-12">
        <PageHeader
          eyebrow={experimentKinds[experiment.kind].label}
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
