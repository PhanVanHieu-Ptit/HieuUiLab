import { Briefcase, NotebookPen } from 'lucide-react'

import { EmptyState } from '@/components/blocks/empty-state'
import { CapabilityGrid } from '@/components/landing/capability-grid'
import { LandingHero } from '@/components/landing/hero'
import { LandingSection } from '@/components/landing/landing-section'
import { RegistryShowcase } from '@/components/landing/registry-showcase'
import { TechStackList } from '@/components/landing/tech-stack-list'
import { ExperimentCard, NoteCard, ProjectCard } from '@/components/site/content-cards'
import { PageContainer } from '@/components/site/page'
import { experiments } from '@/content/experiments'
import {
  featuredBlockSlugs,
  featuredComponentSlugs,
  featuredProjectSlugs,
  recentNotesCount,
} from '@/content/landing'
import { notes } from '@/content/notes'
import { getProject } from '@/content/projects'
import type { Project } from '@/content/types'
import { cities } from '@/lab/map-projections/cities'
import { MapSvg } from '@/lab/map-projections/map-svg'
import { createOrthographic } from '@/lab/map-projections/projection'

const globe = createOrthographic(105, 15)

export function HomePage() {
  const featuredProjects = featuredProjectSlugs
    .map((slug) => getProject(slug))
    .filter((project): project is Project => project !== undefined)
  const recentNotes = notes.slice(0, recentNotesCount)

  return (
    <PageContainer size="page" className="flex flex-col gap-20 py-section sm:gap-24 sm:py-24">
      <LandingHero />

      <LandingSection
        id="capabilities"
        title="What the lab is for"
        description="Three threads run through everything here."
      >
        <CapabilityGrid />
      </LandingSection>

      <LandingSection
        id="featured-components"
        title="Featured components"
        description="Live previews — try them here, then open the docs for source, props, and more examples."
        more={{ label: 'All components', href: '/components' }}
      >
        <RegistryShowcase
          slugs={featuredComponentSlugs}
          category="component"
          className="md:grid-cols-2 lg:grid-cols-3"
        />
      </LandingSection>

      <LandingSection
        id="featured-blocks"
        title="UI blocks"
        description="Components composed into patterns with every state handled: loading, empty, error, and success."
        more={{ label: 'All blocks', href: '/blocks' }}
      >
        <RegistryShowcase slugs={featuredBlockSlugs} category="block" className="lg:grid-cols-2" />
      </LandingSection>

      <LandingSection
        id="lab"
        title="Geospatial and 3D experiments"
        description="Maps and graphics written from first principles, without a map or 3D library."
        more={{ label: 'All experiments', href: '/labs' }}
      >
        <ul className="grid gap-4 md:grid-cols-2">
          {experiments.map((experiment) => (
            <li key={experiment.slug} className="flex">
              <ExperimentCard
                experiment={experiment}
                preview={
                  experiment.slug === 'map-projections' ? (
                    <MapSvg projection={globe} cities={cities} className="max-w-44" />
                  ) : undefined
                }
              />
            </li>
          ))}
        </ul>
      </LandingSection>

      <LandingSection
        id="case-studies"
        title="Engineering case studies"
        description="How parts of this lab were designed, built, and verified."
        more={{ label: 'All case studies', href: '/projects' }}
      >
        {featuredProjects.length === 0 ? (
          <EmptyState
            icon={<Briefcase />}
            title="No case studies yet"
            description="Case studies are published once the work they describe exists."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {featuredProjects.map((project) => (
              <li key={project.slug} className="flex">
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </LandingSection>

      <LandingSection
        id="notes"
        title="Recent technical notes"
        description="Short write-ups of decisions, with their limits."
        more={{ label: 'All notes', href: '/notes' }}
      >
        {recentNotes.length === 0 ? (
          <EmptyState
            icon={<NotebookPen />}
            title="No notes yet"
            description="Notes are added as the lab grows."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentNotes.map((note) => (
              <li key={note.slug} className="flex">
                <NoteCard note={note} />
              </li>
            ))}
          </ul>
        )}
      </LandingSection>

      <LandingSection
        id="stack"
        title="Technology stack"
        description="What the lab is built and tested with."
      >
        <TechStackList />
      </LandingSection>
    </PageContainer>
  )
}
