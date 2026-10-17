import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

export interface ShellView<Id extends string> {
  id: Id
  label: string
  icon: ReactNode
  /** A count or short marker beside the label, with the words a screen reader should hear. */
  badge?: { text: string; label: string }
}

export interface TemplateShellProps<Id extends string> {
  appName: string
  views: readonly ShellView<Id>[]
  activeView: Id
  onViewChange: (id: Id) => void
  /** Example-only chrome, such as a mock state picker. Shown above the app. */
  controls?: ReactNode
  /** The active view. Each view is a block or a small composition of blocks. */
  children: ReactNode
  className?: string
}

/**
 * The frame the example apps share: a header, a list of views, and the active view. It reflows
 * with its own width (container queries), so the preview width switcher works: the views sit
 * beside the content when there is room and above it when there is not. Choosing a view is plain
 * state, not a route, so a template can be copied into any app and wired to its router.
 */
export function TemplateShell<Id extends string>({
  appName,
  views,
  activeView,
  onViewChange,
  controls,
  children,
  className,
}: TemplateShellProps<Id>) {
  const active = views.find((view) => view.id === activeView)

  return (
    <div className={cn('@container flex w-full min-w-0 flex-col gap-4', className)}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold tracking-tight">{appName}</p>
        <Badge variant="outline" size="sm">
          Example app · invented data
        </Badge>
      </header>
      {controls}
      <div className="grid min-w-0 gap-4 @2xl:grid-cols-[12rem_minmax(0,1fr)] @2xl:items-start @2xl:gap-6">
        <nav aria-label={`${appName} sections`}>
          <ul className="flex flex-wrap gap-1 @2xl:flex-col">
            {views.map((view) => (
              <li key={view.id} className="@2xl:w-full">
                <Button
                  type="button"
                  variant={view.id === activeView ? 'secondary' : 'ghost'}
                  size="sm"
                  aria-current={view.id === activeView ? 'page' : undefined}
                  // The name starts with the visible label and adds what the badge means.
                  aria-label={view.badge ? `${view.label}, ${view.badge.label}` : undefined}
                  className="w-full justify-start"
                  onClick={() => {
                    onViewChange(view.id)
                  }}
                >
                  {view.icon}
                  {view.label}
                  {view.badge ? (
                    <Badge variant="primary" size="sm" className="ml-auto">
                      {view.badge.text}
                    </Badge>
                  ) : null}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
      <p aria-live="polite" className="sr-only">
        {active ? `Showing ${active.label}` : ''}
      </p>
    </div>
  )
}
