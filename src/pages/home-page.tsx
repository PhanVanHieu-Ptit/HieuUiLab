import { ArrowRight, BookOpen } from 'lucide-react'
import { Link } from 'react-router'

import { PageContainer, SectionHeader } from '@/components/site/page'
import { StatusBadge } from '@/components/site/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardLink, CardTitle } from '@/components/ui/card'
import { siteConfig } from '@/config/site'
import { registry } from '@/registry'
import type { RegistryStatus } from '@/registry/types'

interface RoadmapItem {
  title: string
  description: string
  status: RegistryStatus
}

// Planned work is listed for transparency; none of it is implemented yet.
const roadmap: readonly RoadmapItem[] = [
  {
    title: 'Form controls',
    description: 'Input, Select, Checkbox, and Switch built on Radix.',
    status: 'planned',
  },
  {
    title: 'Form patterns',
    description: 'React Hook Form + Zod examples with accessible error handling.',
    status: 'planned',
  },
  {
    title: 'Geospatial experiments',
    description: 'MapLibre GL JS demos.',
    status: 'planned',
  },
]

export function HomePage() {
  const components = registry.filter((entry) => entry.category === 'component')

  return (
    <PageContainer className="py-section sm:py-24">
      <section aria-labelledby="hero-title" className="max-w-3xl">
        <p className="mb-4 font-mono text-xs font-medium text-primary">
          React · TypeScript · Tailwind · Radix
        </p>
        <h1 id="hero-title" className="text-title text-balance sm:text-display">
          Reusable UI, documented and tested.
        </h1>
        <p className="mt-5 max-w-prose text-lg text-pretty text-muted-foreground">
          {siteConfig.name} is a personal component registry and frontend engineering lab. Every
          entry ships with a live preview, copyable source, a props reference, and tests.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/components">
              Browse components
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/docs">
              <BookOpen aria-hidden="true" />
              Read the docs
            </Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="status-title" className="mt-20 flex flex-col gap-6">
        <SectionHeader
          id="status-title"
          title="Project status"
          anchorLabel="Project status"
          description={`${String(components.length)} components in the registry, plus what is planned next.`}
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {components.map((entry) => (
            <li key={entry.slug} className="flex">
              <Card variant="interactive" className="flex-1">
                <CardHeader>
                  <CardTitle className="justify-between">
                    <CardLink asChild>
                      <Link to={`/components/${entry.slug}`}>{entry.name}</Link>
                    </CardLink>
                    <StatusBadge status={entry.status} size="sm" />
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{entry.description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
          {roadmap.map((item) => (
            <li key={item.title} className="flex">
              <Card variant="dashed" className="flex-1">
                <CardHeader>
                  <CardTitle className="justify-between">
                    {item.title}
                    <StatusBadge status={item.status} size="sm" />
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </PageContainer>
  )
}
