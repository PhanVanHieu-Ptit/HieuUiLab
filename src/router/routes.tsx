import { replace, type RouteObject } from 'react-router'

import { DocsLayout } from '@/components/site/docs-layout'
import { PageLayout } from '@/components/site/page-layout'
import { RouteFallback } from '@/components/site/route-fallback'
import { SiteLayout } from '@/components/site/site-layout'
import { findDocsNavItem, sections, siteConfig } from '@/config/site'
import type { ExperimentKindInfo } from '@/content/experiments'
import type { Experiment, Note, Project } from '@/content/types'
import { HomePage } from '@/pages/home-page'
import { NotFoundPage, RootErrorPage, RouteErrorPage } from '@/pages/not-found-page'
import { PlannedPage } from '@/pages/planned-page'
import { RegistryIndexPage } from '@/pages/registry-index-page'
import { catalogHref } from '@/registry'
import { registryCategories } from '@/registry/taxonomy'
import type { RegistryEntry } from '@/registry/types'

import {
  experimentKindLoader,
  experimentLoader,
  LAB_KIND_ROUTE_ID,
  legacyLabLoader,
  noteLoader,
  projectLoader,
  registryLoader,
} from './loaders'
import { metaFromData, type PageMeta, type RouteHandle } from './meta'

function handle(meta: RouteHandle['meta']): RouteHandle {
  return { meta }
}

/** Title and description of a docs or planned page, taken from its sidebar entry. */
function docsHandle(href: string): RouteHandle {
  const item = findDocsNavItem(href)
  if (!item) throw new Error(`No docs nav item for ${href}`)
  return handle({
    title: item.title,
    description: item.description,
    noindex: item.status === 'planned',
  })
}

const sectionHandle = (section: PageMeta) => handle(section)

// Lazy page modules: each becomes its own chunk, loaded when the route matches.
const docsIntroduction = () => import('@/pages/docs-introduction-page')
const docsInstallation = () => import('@/pages/docs-installation-page')
const docsArchitecture = () => import('@/pages/docs-architecture-page')
const docsTheming = () => import('@/pages/docs-theming-page')
const registryDetail = () => import('@/pages/registry-detail-page')
const labPages = () => import('@/pages/lab-pages')
const notePages = () => import('@/pages/note-pages')
const projectPages = () => import('@/pages/project-pages')
const aboutPage = () => import('@/pages/about-page')

const registryHandle = handle(
  metaFromData<RegistryEntry>((entry) => ({
    title: entry.name,
    // The category links back to the catalog, filtered to it.
    parents: [
      {
        title: registryCategories[entry.category].label,
        href: catalogHref(entry.kind, { category: entry.category }),
      },
    ],
    description: entry.description,
    // A planned entry has no content worth indexing yet.
    noindex: entry.status === 'planned',
  })),
)

/**
 * The route tree. A factory, not a constant: React Router clears resolved keys on
 * each route's `lazy` object in place, so routes can't be shared between routers
 * (e.g. one per test).
 */
export function createRoutes(): RouteObject[] {
  return [
    {
      element: <SiteLayout />,
      errorElement: <RootErrorPage />,
      handle: handle({
        title: siteConfig.name,
        crumb: 'Home',
        description: siteConfig.description,
      }),
      children: [
        {
          element: <DocsLayout />,
          hydrateFallbackElement: <RouteFallback />,
          children: [
            {
              // Errors render inside the docs layout, so the sidebar stays.
              errorElement: <RouteErrorPage />,
              children: [
                {
                  path: 'docs',
                  handle: sectionHandle(sections.docs),
                  children: [
                    {
                      index: true,
                      lazy: {
                        Component: async () => (await docsIntroduction()).DocsIntroductionPage,
                      },
                    },
                    {
                      path: 'installation',
                      handle: docsHandle('/docs/installation'),
                      lazy: {
                        Component: async () => (await docsInstallation()).DocsInstallationPage,
                      },
                    },
                    {
                      path: 'architecture',
                      handle: docsHandle('/docs/architecture'),
                      lazy: {
                        Component: async () => (await docsArchitecture()).DocsArchitecturePage,
                      },
                    },
                    {
                      path: 'theming',
                      handle: docsHandle('/docs/theming'),
                      lazy: { Component: async () => (await docsTheming()).DocsThemingPage },
                    },
                  ],
                },
                {
                  path: 'components',
                  handle: sectionHandle(sections.components),
                  children: [
                    {
                      index: true,
                      element: <RegistryIndexPage kind="component" {...sections.components} />,
                    },
                    {
                      path: ':slug',
                      loader: registryLoader('component'),
                      handle: registryHandle,
                      lazy: { Component: async () => (await registryDetail()).RegistryDetailPage },
                    },
                  ],
                },
                {
                  path: 'blocks',
                  handle: sectionHandle(sections.blocks),
                  children: [
                    {
                      index: true,
                      element: <RegistryIndexPage kind="block" {...sections.blocks} />,
                    },
                    {
                      path: ':slug',
                      loader: registryLoader('block'),
                      handle: registryHandle,
                      lazy: { Component: async () => (await registryDetail()).RegistryDetailPage },
                    },
                  ],
                },
                {
                  path: 'templates',
                  handle: docsHandle('/templates'),
                  element: <PlannedPage href="/templates" />,
                },
                {
                  path: 'playground',
                  handle: docsHandle('/playground'),
                  element: <PlannedPage href="/playground" />,
                },
              ],
            },
          ],
        },
        {
          element: <PageLayout />,
          hydrateFallbackElement: <RouteFallback />,
          children: [
            {
              errorElement: <RouteErrorPage contained />,
              children: [
                { index: true, element: <HomePage /> },
                {
                  path: 'labs',
                  handle: sectionHandle(sections.labs),
                  children: [
                    {
                      index: true,
                      lazy: { Component: async () => (await labPages()).LabIndexPage },
                    },
                    {
                      id: LAB_KIND_ROUTE_ID,
                      path: ':kind',
                      loader: experimentKindLoader,
                      handle: handle(
                        metaFromData<ExperimentKindInfo>((kind) => ({
                          title: kind.title,
                          description: kind.description,
                        })),
                      ),
                      children: [
                        {
                          index: true,
                          lazy: { Component: async () => (await labPages()).LabCategoryPage },
                        },
                        {
                          path: ':slug',
                          loader: experimentLoader,
                          handle: handle(
                            metaFromData<Experiment>((experiment) => ({
                              title: experiment.title,
                              description: experiment.summary,
                            })),
                          ),
                          lazy: { Component: async () => (await labPages()).LabDetailPage },
                        },
                      ],
                    },
                  ],
                },
                {
                  path: 'projects',
                  handle: sectionHandle(sections.projects),
                  children: [
                    {
                      index: true,
                      lazy: { Component: async () => (await projectPages()).ProjectsIndexPage },
                    },
                    {
                      path: ':slug',
                      loader: projectLoader,
                      handle: handle(
                        metaFromData<Project>((project) => ({
                          title: project.title,
                          description: project.summary,
                        })),
                      ),
                      lazy: { Component: async () => (await projectPages()).ProjectDetailPage },
                    },
                  ],
                },
                {
                  path: 'notes',
                  handle: sectionHandle(sections.notes),
                  children: [
                    {
                      index: true,
                      lazy: { Component: async () => (await notePages()).NotesIndexPage },
                    },
                    {
                      path: ':slug',
                      loader: noteLoader,
                      handle: handle(
                        metaFromData<Note>((note) => ({
                          title: note.title,
                          description: note.summary,
                        })),
                      ),
                      lazy: { Component: async () => (await notePages()).NoteDetailPage },
                    },
                  ],
                },
                {
                  path: 'about',
                  handle: sectionHandle(sections.about),
                  lazy: { Component: async () => (await aboutPage()).AboutPage },
                },
                {
                  // Moved to /labs; redirects replace the history entry so Back does not bounce.
                  path: 'lab',
                  children: [
                    { index: true, loader: () => replace('/labs') },
                    { path: ':slug', loader: legacyLabLoader },
                  ],
                },
                {
                  path: '*',
                  handle: handle({ title: 'Page not found', notFound: true }),
                  element: <NotFoundPage />,
                },
              ],
            },
          ],
        },
      ],
    },
  ]
}
