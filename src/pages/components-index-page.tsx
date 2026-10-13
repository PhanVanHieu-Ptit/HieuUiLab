import { Link } from 'react-router'

import { StatusBadge } from '@/components/site/status-badge'
import { registry } from '@/registry'

export function ComponentsIndexPage() {
  const components = registry.filter((entry) => entry.category === 'component')

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Components</h1>
        <p className="mt-2 text-muted-foreground">
          Accessible building blocks. Copy the source into your project and own it.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {components.map((entry) => (
          <li
            key={entry.slug}
            className="relative rounded-lg border bg-surface p-5 hover:bg-accent/40"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-medium">
                <Link
                  to={`/components/${entry.slug}`}
                  className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-ring"
                >
                  {entry.name}
                </Link>
              </h2>
              <StatusBadge status={entry.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{entry.description}</p>
          </li>
        ))}
      </ul>
    </article>
  )
}
