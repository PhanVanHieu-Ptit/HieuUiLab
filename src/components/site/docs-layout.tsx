import { Outlet, useLocation } from 'react-router'

import { getDocsBreadcrumbs } from '@/config/site'

import { CrumbTrail } from './crumb-trail'
import { MainContent } from './main-content'
import { SiteSidebar } from './site-sidebar'

function DocsBreadcrumbs() {
  const { pathname } = useLocation()
  return <CrumbTrail crumbs={getDocsBreadcrumbs(pathname)} className="mb-6" />
}

export function DocsLayout() {
  return (
    <div className="mx-auto w-full max-w-page flex-1 px-gutter md:grid md:grid-cols-[var(--spacing-sidebar)_minmax(0,1fr)] md:gap-10 lg:gap-14">
      <aside className="sticky top-header hidden h-[calc(100dvh-var(--spacing-header))] overflow-y-auto overscroll-contain py-8 pr-2 md:block">
        <SiteSidebar />
      </aside>
      <MainContent className="min-w-0 pt-6 pb-section md:pt-8">
        <DocsBreadcrumbs />
        <Outlet />
      </MainContent>
    </div>
  )
}
