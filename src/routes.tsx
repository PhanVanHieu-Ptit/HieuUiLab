import type { RouteObject } from 'react-router'

import { DocsLayout } from '@/components/site/docs-layout'
import { PageLayout } from '@/components/site/page-layout'
import { SiteLayout } from '@/components/site/site-layout'
import { DocsIntroductionPage } from '@/pages/docs-introduction-page'
import { DocsThemingPage } from '@/pages/docs-theming-page'
import { HomePage } from '@/pages/home-page'
import { LabDetailPage, LabIndexPage } from '@/pages/lab-pages'
import { NoteDetailPage, NotesIndexPage } from '@/pages/note-pages'
import { NotFoundPage } from '@/pages/not-found-page'
import { ProjectDetailPage, ProjectsIndexPage } from '@/pages/project-pages'
import { RegistryDetailPage } from '@/pages/registry-detail-page'
import { RegistryIndexPage } from '@/pages/registry-index-page'

export const routes: RouteObject[] = [
  {
    element: <SiteLayout />,
    children: [
      {
        element: <DocsLayout />,
        children: [
          { path: 'docs', element: <DocsIntroductionPage /> },
          { path: 'docs/theming', element: <DocsThemingPage /> },
          {
            path: 'components',
            element: (
              <RegistryIndexPage
                category="component"
                title="Components"
                description="Accessible building blocks. Copy the source into your project and own it."
              />
            ),
          },
          { path: 'components/:slug', element: <RegistryDetailPage category="component" /> },
          {
            path: 'blocks',
            element: (
              <RegistryIndexPage
                category="block"
                title="Blocks"
                description="Components composed into patterns, with loading, empty, error, and success states handled."
              />
            ),
          },
          { path: 'blocks/:slug', element: <RegistryDetailPage category="block" /> },
        ],
      },
      {
        element: <PageLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'lab', element: <LabIndexPage /> },
          { path: 'lab/:slug', element: <LabDetailPage /> },
          { path: 'projects', element: <ProjectsIndexPage /> },
          { path: 'projects/:slug', element: <ProjectDetailPage /> },
          { path: 'notes', element: <NotesIndexPage /> },
          { path: 'notes/:slug', element: <NoteDetailPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
