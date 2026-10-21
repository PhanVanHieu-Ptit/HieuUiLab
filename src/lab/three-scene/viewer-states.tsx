import { Box, MonitorX } from 'lucide-react'

import { EmptyState } from '@/components/blocks/empty-state'
import { ErrorState } from '@/components/blocks/error-state'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import type { SceneInitError } from './scene-types'

/** Shown instead of the viewer where the browser cannot create a WebGL2 context. */
export function SceneUnavailable() {
  return (
    <EmptyState
      icon={<MonitorX />}
      title="3D scene unavailable"
      description="This browser could not create a WebGL2 context, which Three.js needs, so the 3D code was not downloaded. Try another browser or turn on hardware acceleration."
    />
  )
}

/** Covers the canvas until its first draw. The only status region the viewer owns while loading. */
export function SceneLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-muted/60 text-sm text-muted-foreground">
      <Spinner label="Loading 3D scene" />
      <span aria-hidden="true">Loading 3D scene…</span>
    </div>
  )
}

export interface SceneFailureProps {
  error: SceneInitError
  onRetry: () => void
}

/** Covers the canvas when the scene could not start. Reloading is offered where retrying cannot help. */
export function SceneFailure({ error, onRetry }: SceneFailureProps) {
  // A failed dynamic import is cached by the browser for the page’s lifetime, so only a reload
  // can fetch the code again.
  const needsReload = error.kind === 'import-failed'
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background p-4">
      <ErrorState
        icon={<Box />}
        title={needsReload ? 'The 3D code could not be loaded' : 'The 3D scene could not start'}
        description={
          needsReload
            ? 'Check your connection, then reload the page.'
            : 'Something went wrong while creating the scene. Try again, or reload the page.'
        }
        {...(needsReload ? {} : { onRetry })}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.reload()
            }}
          >
            Reload page
          </Button>
        }
      />
    </div>
  )
}
