import { Construction } from 'lucide-react'

import { EmptyState } from '@/components/blocks/empty-state'
import { PageHeader } from '@/components/site/page'
import { SmartLink } from '@/components/site/smart-link'
import { StatusBadge } from '@/components/site/status-badge'
import { buttonVariants } from '@/components/ui/button'
import { findDocsNavItem, siteConfig } from '@/config/site'

/**
 * A route that is reserved but not built. Title and intent come from the nav
 * entry, so the page cannot drift from the sidebar, and it shows no placeholder content.
 */
export function PlannedPage({ href }: { href: string }) {
  const item = findDocsNavItem(href)
  if (!item) return null

  return (
    <article className="flex flex-col gap-8">
      <PageHeader
        title={item.title}
        meta={<StatusBadge status="planned" />}
        {...(item.description ? { description: item.description } : {})}
      />
      <EmptyState
        icon={<Construction />}
        headingLevel="h2"
        title="Not implemented yet"
        description="This section is planned, and nothing in it has been built. It is listed so the roadmap is visible; it will appear here once it works."
        actions={
          <SmartLink
            href={siteConfig.issuesUrl}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Suggest what it should cover
          </SmartLink>
        }
      />
    </article>
  )
}
