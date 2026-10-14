import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

import { MainContent } from '@/components/site/main-content'
import { PageContainer } from '@/components/site/page'
import { Button } from '@/components/ui/button'
import type { Crumb } from '@/config/site'
import { useRouteMeta } from '@/router/meta'

/** The 404 message. `section` adds a way back to the nearest section that exists. */
export function NotFoundContent({ section }: { section?: Crumb | undefined }) {
  return (
    <div className="py-16 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-title">Page not found</h1>
      <p className="mt-3 text-muted-foreground">The page you are looking for does not exist.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {section?.href ? (
          <Button asChild>
            <Link to={section.href}>Browse {section.title}</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  )
}

/** The catch-all route for URLs that match nothing. */
export function NotFoundPage() {
  return (
    <PageContainer>
      <NotFoundContent />
    </PageContainer>
  )
}

function ErrorContent() {
  const error = useRouteError()
  const { crumbs } = useRouteMeta()

  if (isRouteErrorResponse(error) && error.status === 404) {
    // The deepest route that resolved, e.g. "Notes" for an unknown note.
    return <NotFoundContent section={crumbs.length > 1 ? crumbs.at(-1) : undefined} />
  }

  return (
    <div className="py-16 text-center">
      <h1 className="text-title">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">
        This page failed to load. Reloading usually helps; if it keeps happening, please open an
        issue.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => {
            window.location.reload()
          }}
        >
          Reload page
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  )
}

/**
 * Error boundary for routes inside a layout: unknown slugs (404 from a loader)
 * and render errors. The layout, header, and sidebar stay in place.
 */
export function RouteErrorPage({ contained = false }: { contained?: boolean }) {
  return contained ? (
    <PageContainer>
      <ErrorContent />
    </PageContainer>
  ) : (
    <ErrorContent />
  )
}

/** Last-resort boundary if the site shell itself fails to render. */
export function RootErrorPage() {
  return (
    <MainContent className="min-h-dvh">
      <RouteErrorPage contained />
    </MainContent>
  )
}
