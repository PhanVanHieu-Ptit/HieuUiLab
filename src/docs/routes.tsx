import { replace, type RouteObject } from 'react-router'

import type { Crumb } from '@/config/site'
import { docLoader, docNotFoundLoader } from '@/router/loaders'
import type { RouteHandle } from '@/router/meta'

import { DOCS_BASE, docGroups, docRedirects, type DocEntry, type DocGroup } from './manifest'

// The page component and the Markdown parser behind it load when a docs route matches.
const docsRoutePage = () => import('./docs-route-page')

const lazyPage = () => ({ Component: async () => (await docsRoutePage()).DocsRoutePage })

function pageHandle(entry: DocEntry, parents: readonly Crumb[] = []): RouteHandle {
  return {
    meta: {
      title: entry.title,
      description: entry.description,
      ...(parents.length > 0 ? { parents } : {}),
    },
  }
}

/**
 * A route per page, nested like the URLs. The group a top-level page belongs to is a crumb
 * without a link, so the trail reads Docs › Guides › Form integration. A page with children
 * gets a parent route (for its crumb) and an index route (its own content).
 */
function pageRoute(entry: DocEntry, group: DocGroup | undefined): RouteObject {
  const handle = pageHandle(entry, group ? [{ title: group.title }] : [])
  if (entry.children && entry.children.length > 0) {
    if (entry.slug === '') throw new Error(`The docs index "${entry.id}" cannot have child pages`)
    return {
      path: entry.slug,
      handle,
      children: [
        { index: true, handle: pageHandle(entry), loader: docLoader(entry), lazy: lazyPage() },
        ...entry.children.map((child) => pageRoute(child, undefined)),
      ],
    }
  }
  const page = { handle, loader: docLoader(entry), lazy: lazyPage() }
  return entry.slug === '' ? { index: true, ...page } : { path: entry.slug, ...page }
}

/**
 * The children of the `docs` route, generated from the manifest: one route per page, a redirect
 * per moved URL, and a catch-all that turns any other path under `/docs` into a 404 inside the
 * docs layout (sidebar kept) with "did you mean" links. A function, not a constant, for the
 * reason given on `createRoutes`: React Router mutates each route's `lazy` object.
 */
export function createDocsRoutes(): RouteObject[] {
  return [
    ...docGroups.flatMap((group) => group.pages.map((page) => pageRoute(page, group))),
    ...Object.entries(docRedirects).map(([from, to]): RouteObject => ({
      path: from.slice(DOCS_BASE.length + 1),
      loader: () => replace(to),
    })),
    {
      path: '*',
      loader: docNotFoundLoader,
      // No metadata, so the page resolves as not found; the last crumb stays "Docs".
      handle: { meta: () => undefined } satisfies RouteHandle,
    },
  ]
}
