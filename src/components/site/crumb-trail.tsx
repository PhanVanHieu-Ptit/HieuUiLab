import { Link } from 'react-router'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { Crumb } from '@/config/site'

/** Breadcrumbs from a list of crumbs; the last one is the current page. */
export function CrumbTrail({
  crumbs,
  className,
}: {
  crumbs: readonly Crumb[]
  className?: string
}) {
  if (crumbs.length === 0) return null

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return [
            <BreadcrumbItem key={crumb.title}>
              {isLast ? (
                <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
              ) : crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link to={crumb.href}>{crumb.title}</Link>
                </BreadcrumbLink>
              ) : (
                <span>{crumb.title}</span>
              )}
            </BreadcrumbItem>,
            isLast ? null : <BreadcrumbSeparator key={`${crumb.title}-separator`} />,
          ]
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
