import { CircleAlert, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState, type EmptyStateProps } from '@/components/blocks/empty-state'
import { Button } from '@/components/ui/button'

export interface ErrorStateProps extends Omit<EmptyStateProps, 'title' | 'icon'> {
  title?: ReactNode
  /** What went wrong and what the user can do. Defaults to a connection hint. */
  description?: ReactNode
  /** Renders a retry button before any other `actions`. */
  onRetry?: () => void
  retryLabel?: string
  /** Decorative icon; hidden from assistive tech. */
  icon?: ReactNode
}

/**
 * An EmptyState for failures, announced with `role="alert"`. Say what failed
 * and offer a way forward: a retry, or a link elsewhere through `actions`.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'Check your connection, then try again.',
  onRetry,
  retryLabel = 'Try again',
  icon = <CircleAlert />,
  actions,
  ...props
}: ErrorStateProps) {
  return (
    <EmptyState
      role="alert"
      icon={icon}
      title={title}
      description={description}
      actions={
        onRetry || actions ? (
          <>
            {onRetry ? (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RotateCw aria-hidden="true" />
                {retryLabel}
              </Button>
            ) : null}
            {actions}
          </>
        ) : null
      }
      {...props}
    />
  )
}
