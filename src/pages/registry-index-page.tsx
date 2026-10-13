import { Inbox } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { PageHeader } from '@/components/site/page'
import { StatusBadge } from '@/components/site/status-badge'
import { Card, CardDescription, CardHeader, CardLink, CardTitle } from '@/components/ui/card'
import { getRegistryEntries, registryHref } from '@/registry'
import type { RegistryCategory } from '@/registry/types'

interface RegistryIndexPageProps {
  category: RegistryCategory
  title: string
  description: string
}

export function RegistryIndexPage({ category, title, description }: RegistryIndexPageProps) {
  const entries = getRegistryEntries(category)

  return (
    <article className="flex flex-col gap-8">
      <PageHeader title={title} description={description} />
      {entries.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          headingLevel="h2"
          title={`No ${title.toLowerCase()} yet`}
          description="Entries appear here once they are implemented and documented."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <li key={entry.slug} className="flex">
              <Card variant="interactive" className="flex-1">
                <CardHeader>
                  <CardTitle as="h2" className="justify-between">
                    <CardLink asChild>
                      <Link to={registryHref(entry)}>{entry.name}</Link>
                    </CardLink>
                    <StatusBadge status={entry.status} size="sm" />
                  </CardTitle>
                  <CardDescription className="line-clamp-3">{entry.description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
