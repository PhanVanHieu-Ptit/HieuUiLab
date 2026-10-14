import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { registryHref } from '@/registry'
import { registryCategories } from '@/registry/taxonomy'
import { isImplemented, type RegistryEntry } from '@/registry/types'

import { StatusBadge } from './status-badge'

interface RegistryCardProps {
  entry: RegistryEntry
  headingLevel?: 'h2' | 'h3'
  /** Render the first example live above the title. Planned entries never have one. */
  showPreview?: boolean
  /** Show the category and tags under the description. */
  showTaxonomy?: boolean
  className?: string
}

/**
 * A registry entry as a card, used by the landing page and the index pages. Every
 * field comes from the entry, so the two never disagree.
 */
export function RegistryCard({
  entry,
  headingLevel = 'h3',
  showPreview = false,
  showTaxonomy = false,
  className,
}: RegistryCardProps) {
  const Example = showPreview && isImplemented(entry) ? entry.examples[0].component : undefined
  const planned = !isImplemented(entry)

  return (
    // A dashed border sets planned entries apart without relying on the badge alone.
    <Card
      variant="interactive"
      className={cn('flex-1 overflow-hidden', planned && 'border-dashed', className)}
    >
      {Example ? (
        // Above the card's stretched link so the preview stays interactive.
        <div
          role="group"
          aria-label={`${entry.name} live preview`}
          className="relative z-10 flex min-h-44 items-center justify-center-safe overflow-x-auto border-b bg-background/60 p-6"
        >
          <Example />
        </div>
      ) : null}
      <CardHeader>
        <CardTitle as={headingLevel} className="justify-between">
          <CardLink asChild>
            <Link to={registryHref(entry)}>{entry.name}</Link>
          </CardLink>
          <StatusBadge status={entry.status} size="sm" />
        </CardTitle>
        <CardDescription className="line-clamp-3">{entry.description}</CardDescription>
      </CardHeader>
      {showTaxonomy ? (
        <CardFooter className="mt-auto flex-wrap">
          <Badge size="sm" variant="primary">
            {registryCategories[entry.category].label}
          </Badge>
          {entry.tags.map((tag) => (
            <Badge key={tag} size="sm" variant="outline">
              {tag}
            </Badge>
          ))}
        </CardFooter>
      ) : null}
    </Card>
  )
}
