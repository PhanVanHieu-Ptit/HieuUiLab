import { EyeOff } from 'lucide-react'

import { EmptyState } from '@/components/blocks/empty-state'
import { RegistryCard } from '@/components/site/registry-card'
import { cn } from '@/lib/cn'
import { getImplementedEntry } from '@/registry'
import type { RegistryKind } from '@/registry/types'

interface RegistryShowcaseProps {
  slugs: readonly string[]
  kind: RegistryKind
  className?: string
}

/**
 * Live previews of featured registry entries. Only implemented entries are shown;
 * a missing or planned slug renders an unavailable state instead of a preview.
 */
export function RegistryShowcase({ slugs, kind, className }: RegistryShowcaseProps) {
  return (
    <ul className={cn('grid gap-4', className)}>
      {slugs.map((slug) => {
        const entry = getImplementedEntry(slug, kind)
        return (
          <li key={slug} className="flex min-w-0">
            {entry ? (
              <RegistryCard entry={entry} showPreview />
            ) : (
              <EmptyState
                className="flex-1"
                icon={<EyeOff />}
                title="Preview unavailable"
                description={`“${slug}” is not an implemented registry entry right now.`}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
