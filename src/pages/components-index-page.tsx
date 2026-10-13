import { Link } from 'react-router'

import { PageHeader } from '@/components/site/page'
import { StatusBadge } from '@/components/site/status-badge'
import { Card, CardDescription, CardHeader, CardLink, CardTitle } from '@/components/ui/card'
import { registry } from '@/registry'

export function ComponentsIndexPage() {
  const components = registry.filter((entry) => entry.category === 'component')

  return (
    <article className="flex flex-col gap-8">
      <PageHeader
        title="Components"
        description="Accessible building blocks. Copy the source into your project and own it."
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {components.map((entry) => (
          <li key={entry.slug} className="flex">
            <Card variant="interactive" className="flex-1">
              <CardHeader>
                <CardTitle as="h2" className="justify-between">
                  <CardLink asChild>
                    <Link to={`/components/${entry.slug}`}>{entry.name}</Link>
                  </CardLink>
                  <StatusBadge status={entry.status} size="sm" />
                </CardTitle>
                <CardDescription className="line-clamp-3">{entry.description}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </article>
  )
}
