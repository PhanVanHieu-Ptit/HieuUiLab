import { useRouteMeta } from '@/router/meta'

import { CrumbTrail } from './crumb-trail'

/** Breadcrumbs for the current route, from route metadata. Hidden on the home and not-found pages. */
export function RouteBreadcrumbs({ className }: { className?: string }) {
  const { crumbs, notFound } = useRouteMeta()
  if (notFound || crumbs.length < 2) return null
  return <CrumbTrail crumbs={crumbs} {...(className ? { className } : {})} />
}
