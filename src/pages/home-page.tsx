import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

import { StatusBadge } from '@/components/site/status-badge'
import { Button } from '@/components/ui/button'
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
    title: 'More primitives',
    description: 'Input, Dialog, Tabs, and form controls built on Radix.',
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
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-16 outline-none sm:py-24">
      <section aria-labelledby="hero-title" className="max-w-3xl">
        <p className="mb-3 font-mono text-sm text-primary">React · TypeScript · Tailwind</p>
        <h1
          id="hero-title"
          className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
        >
          Reusable UI, documented and tested.
        </h1>
        <p className="mt-4 text-lg text-pretty text-muted-foreground">
          Hieu UI Lab is a personal component registry and frontend engineering lab. Every entry
          ships with a live preview, copyable source, a props reference, and tests.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/components">
              Browse components
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="status-title" className="mt-20">
        <h2 id="status-title" className="text-xl font-semibold tracking-tight">
          Project status
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {registry.map((entry) => (
            <li key={entry.slug} className="rounded-lg border bg-surface p-5">
              <div className="flex items-center justify-between gap-2">
                <Link
                  to={`/components/${entry.slug}`}
                  className="rounded-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {entry.name}
                </Link>
                <StatusBadge status={entry.status} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{entry.description}</p>
            </li>
          ))}
          {roadmap.map((item) => (
            <li key={item.title} className="rounded-lg border border-dashed p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{item.title}</span>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
