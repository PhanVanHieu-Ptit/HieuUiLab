import { EyeOff } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { StatusBadge } from '@/components/site/status-badge'
import { Card, CardDescription, CardHeader, CardLink, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { getRegistryEntry, registryHref } from '@/registry'
import type { RegistryCategory, RegistryEntry } from '@/registry/types'

function PreviewCard({ entry }: { entry: RegistryEntry }) {
  const demo = entry.demos[0]
  const Demo = demo?.component

  return (
    <Card variant="interactive" className="flex-1 overflow-hidden">
      {Demo ? (
        // Above the card's stretched link so the preview stays interactive.
        <div
          role="group"
          aria-label={`${entry.name} live preview`}
          className="relative z-10 flex min-h-44 items-center justify-center-safe overflow-x-auto border-b bg-background/60 p-6"
        >
          <Demo />
        </div>
      ) : null}
      <CardHeader>
        <CardTitle className="justify-between">
          <CardLink asChild>
            <Link to={registryHref(entry)}>{entry.name}</Link>
          </CardLink>
          <StatusBadge status={entry.status} size="sm" />
        </CardTitle>
        <CardDescription className="line-clamp-2">{entry.description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

interface RegistryShowcaseProps {
  slugs: readonly string[]
  category: RegistryCategory
  className?: string
}

/** Live previews of featured registry entries; a missing slug renders an unavailable state. */
export function RegistryShowcase({ slugs, category, className }: RegistryShowcaseProps) {
  return (
    <ul className={cn('grid gap-4', className)}>
      {slugs.map((slug) => {
        const entry = getRegistryEntry(slug, category)
        return (
          <li key={slug} className="flex min-w-0">
            {entry ? (
              <PreviewCard entry={entry} />
            ) : (
              <EmptyState
                className="flex-1"
                icon={<EyeOff />}
                title="Preview unavailable"
                description={`“${slug}” is not in the registry right now.`}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
