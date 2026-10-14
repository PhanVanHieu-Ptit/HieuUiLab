import { Outlet } from 'react-router'

import { MainContent } from './main-content'
import { PageContainer } from './page'
import { RouteBreadcrumbs } from './route-breadcrumbs'

/** Full-width pages outside the docs (home, labs, notes, projects, about, 404). */
export function PageLayout() {
  return (
    <MainContent className="flex-1">
      <PageContainer className="pt-6 empty:hidden md:pt-8">
        <RouteBreadcrumbs />
      </PageContainer>
      <Outlet />
    </MainContent>
  )
}
