import type { RouteObject } from 'react-router'

import { DocsLayout } from '@/components/site/docs-layout'
import { SiteLayout } from '@/components/site/site-layout'
import { ComponentDetailPage } from '@/pages/component-detail-page'
import { ComponentsIndexPage } from '@/pages/components-index-page'
import { HomePage } from '@/pages/home-page'
import { NotFoundPage } from '@/pages/not-found-page'

export const routes: RouteObject[] = [
  {
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'components',
        element: <DocsLayout />,
        children: [
          { index: true, element: <ComponentsIndexPage /> },
          { path: ':slug', element: <ComponentDetailPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
