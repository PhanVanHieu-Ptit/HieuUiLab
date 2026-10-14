import { Outlet } from 'react-router'

import { MainContent } from './main-content'
import { RouteBreadcrumbs } from './route-breadcrumbs'
import { SiteSidebar } from './site-sidebar'

export function DocsLayout() {
  return (
    <div className="mx-auto w-full max-w-page flex-1 px-gutter md:grid md:grid-cols-[var(--spacing-sidebar)_minmax(0,1fr)] md:gap-10 lg:gap-14">
      <aside className="sticky top-header hidden h-[calc(100dvh-var(--spacing-header))] overflow-y-auto overscroll-contain py-8 pr-2 md:block">
        <SiteSidebar />
      </aside>
      <MainContent className="min-w-0 pt-6 pb-section md:pt-8">
        <RouteBreadcrumbs className="mb-6" />
        <Outlet />
      </MainContent>
    </div>
  )
}
