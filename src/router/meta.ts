import { useMatches, type UIMatch } from 'react-router'

import { siteConfig, type Crumb } from '@/config/site'

export interface PageMeta {
  /** Page title; also the breadcrumb label unless `crumb` is set. */
  title: string
  crumb?: string | undefined
  /** Crumbs between the parent route and this page, e.g. the entry's category in its catalog. */
  parents?: readonly Crumb[] | undefined
  description?: string | undefined
  /** Keep the page out of search indexes, e.g. a planned page or a 404. */
  noindex?: boolean | undefined
  /** The not-found page: no breadcrumb trail, not indexed. */
  notFound?: boolean | undefined
}

/**
 * The `handle` of a route. A function receives the route's loader data, which is
 * `undefined` when the loader threw (an unknown slug), and then returns `undefined`.
 */
export interface RouteHandle {
  meta: PageMeta | ((data: unknown) => PageMeta | undefined)
}

/** Metadata built from a route's loader data; unresolved when the data is missing. */
// T names the loader's data type at the call site; the router hands it over as unknown.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function metaFromData<T>(build: (data: T) => PageMeta): RouteHandle['meta'] {
  return (data) => (data === undefined ? undefined : build(data as T))
}

export interface ResolvedRouteMeta {
  /** One per route with metadata, from Home to the current page. */
  crumbs: Crumb[]
  /** Value for `document.title`. */
  documentTitle: string
  description: string
  noindex: boolean
  /** The URL matched no page, or a route's data was not found. */
  notFound: boolean
}

function isRouteHandle(handle: unknown): handle is RouteHandle {
  return typeof handle === 'object' && handle !== null && 'meta' in handle
}

export function resolveRouteMeta(matches: readonly UIMatch[]): ResolvedRouteMeta {
  const crumbs: Crumb[] = []
  let page: PageMeta | undefined
  let description: string = siteConfig.description
  let noindex = false
  let notFound = false

  for (const match of matches) {
    if (!isRouteHandle(match.handle)) continue
    const { meta } = match.handle
    const resolved = typeof meta === 'function' ? meta(match.loaderData) : meta
    if (!resolved) {
      notFound = true
      break
    }
    page = resolved
    if (resolved.notFound) notFound = true
    if (resolved.noindex) noindex = true
    if (resolved.description) description = resolved.description
    if (crumbs.at(-1)?.href !== match.pathname) {
      crumbs.push(...(resolved.parents ?? []), {
        title: resolved.crumb ?? resolved.title,
        href: match.pathname,
      })
    }
  }

  if (notFound) {
    return {
      crumbs,
      documentTitle: `Page not found · ${siteConfig.name}`,
      description: siteConfig.description,
      noindex: true,
      notFound,
    }
  }

  return {
    crumbs,
    // Only the root route (the home page) contributes: use the bare site name.
    documentTitle:
      crumbs.length > 1 && page ? `${page.title} · ${siteConfig.name}` : siteConfig.name,
    description,
    noindex,
    notFound,
  }
}

export function useRouteMeta(): ResolvedRouteMeta {
  return resolveRouteMeta(useMatches())
}
