import { Link, Outlet, useLocation } from 'react-router'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getDocsBreadcrumbs } from '@/config/site'

import { MainContent } from './main-content'
import { SiteSidebar } from './site-sidebar'

function DocsBreadcrumbs() {
  const { pathname } = useLocation()
  const crumbs = getDocsBreadcrumbs(pathname)
  if (crumbs.length === 0) return null

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return [
            <BreadcrumbItem key={crumb.title}>
              {isLast ? (
                <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
              ) : crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link to={crumb.href}>{crumb.title}</Link>
                </BreadcrumbLink>
              ) : (
                <span>{crumb.title}</span>
              )}
            </BreadcrumbItem>,
            isLast ? null : <BreadcrumbSeparator key={`${crumb.title}-separator`} />,
          ]
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
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
