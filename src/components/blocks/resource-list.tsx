import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/blocks/empty-state'
import { ErrorState } from '@/components/blocks/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'

/** Every state a remote collection can be in; `ready` with no items is the empty state. */
export type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | { status: 'ready'; items: readonly T[] }

export interface ResourceListProps<T> {
  /** Plural noun for the collection, e.g. "saved views". Used in messages and labels. */
  label: string
  state: ResourceState<T>
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  /** Shown when the collection loads with no items. */
  empty?: { title?: ReactNode; description?: ReactNode; action?: ReactNode }
  /** Renders a retry button in the error state. */
  onRetry?: () => void
  /** Placeholder rows while loading. */
  skeletonRows?: number
  className?: string
}

/** A list that renders loading, error, empty, and ready states explicitly. */
export function ResourceList<T>({
  label,
  state,
  getKey,
  renderItem,
  empty,
  onRetry,
  skeletonRows = 3,
  className,
}: ResourceListProps<T>) {
  if (state.status === 'loading') {
    return (
      <div role="status" className={cn('flex flex-col gap-2', className)}>
        <span className="sr-only">Loading {label}…</span>
        {Array.from({ length: skeletonRows }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <ErrorState
        className={className}
        title={`Couldn’t load ${label}`}
        description={state.message ?? 'Check your connection, then try again.'}
        {...(onRetry ? { onRetry } : {})}
      />
    )
  }

  if (state.items.length === 0) {
    return (
      <EmptyState
        className={className}
        icon={<Inbox />}
        title={empty?.title ?? `No ${label} yet`}
        description={empty?.description}
        actions={empty?.action}
      />
    )
  }

  return (
    <ul
      aria-label={label}
      className={cn('divide-y rounded-lg border bg-surface text-surface-foreground', className)}
    >
      {state.items.map((item) => (
        <li key={getKey(item)} className="px-4 py-3">
          {renderItem(item)}
        </li>
      ))}
    </ul>
  )
}
