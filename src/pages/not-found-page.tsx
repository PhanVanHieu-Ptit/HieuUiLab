import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

import { MainContent } from '@/components/site/main-content'
import { PageContainer } from '@/components/site/page'
import { Button } from '@/components/ui/button'
import type { Crumb } from '@/config/site'
import type { NotFoundData } from '@/router/loaders'
import { useRouteMeta } from '@/router/meta'

interface NotFoundContentProps {
  /** Adds a way back to the nearest section that exists. */
  section?: Crumb | undefined
  /** Pages the visitor may have meant, e.g. registry entries close to a mistyped slug. */
  suggestions?: readonly Crumb[] | undefined
}

/** The 404 message. */
export function NotFoundContent({ section, suggestions = [] }: NotFoundContentProps) {
  return (
    <div className="py-16 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-title">Page not found</h1>
      <p className="mt-3 text-muted-foreground">The page you are looking for does not exist.</p>
      {suggestions.length > 0 ? (
        <nav aria-label="Suggestions" className="mt-6">
          <h2 className="text-sm font-medium">Did you mean</h2>
          <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {suggestions.map((suggestion) =>
              suggestion.href ? (
                <li key={suggestion.href}>
                  <Link
                    to={suggestion.href}
                    className="rounded-sm font-medium text-primary underline-offset-4 focus-ring hover:underline"
                  >
                    {suggestion.title}
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        </nav>
      ) : null}
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

function suggestionsFrom(data: unknown): Crumb[] {
  if (typeof data !== 'object' || data === null || !('suggestions' in data)) return []
  const { suggestions } = data as Partial<NotFoundData>
  return suggestions ? [...suggestions] : []
}

function ErrorContent() {
  const error = useRouteError()
  const { crumbs } = useRouteMeta()

  if (isRouteErrorResponse(error) && error.status === 404) {
    // The deepest route that resolved, e.g. "Notes" for an unknown note.
    return (
      <NotFoundContent
        section={crumbs.length > 1 ? crumbs.at(-1) : undefined}
        suggestions={suggestionsFrom(error.data)}
      />
    )
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
