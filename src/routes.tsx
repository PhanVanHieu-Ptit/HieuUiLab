import type { RouteObject } from 'react-router'

import { DocsLayout } from '@/components/site/docs-layout'
import { PageLayout } from '@/components/site/page-layout'
import { SiteLayout } from '@/components/site/site-layout'
import { ComponentDetailPage } from '@/pages/component-detail-page'
import { ComponentsIndexPage } from '@/pages/components-index-page'
import { DocsIntroductionPage } from '@/pages/docs-introduction-page'
import { DocsThemingPage } from '@/pages/docs-theming-page'
import { HomePage } from '@/pages/home-page'
import { NotFoundPage } from '@/pages/not-found-page'

export const routes: RouteObject[] = [
  {
    element: <SiteLayout />,
    children: [
      {
        element: <DocsLayout />,
        children: [
          { path: 'docs', element: <DocsIntroductionPage /> },
          { path: 'docs/theming', element: <DocsThemingPage /> },
          { path: 'components', element: <ComponentsIndexPage /> },
          { path: 'components/:slug', element: <ComponentDetailPage /> },
        ],
      },
      {
        element: <PageLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
