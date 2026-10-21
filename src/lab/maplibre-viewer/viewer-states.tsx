import { MapPinOff, MonitorX } from 'lucide-react'

import { EmptyState } from '@/components/blocks/empty-state'
import { ErrorState } from '@/components/blocks/error-state'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import type { MapInitError } from './map-types'

/** Shown instead of the viewer where the browser cannot create a WebGL2 context. */
export function MapUnavailable() {
  return (
    <EmptyState
      icon={<MonitorX />}
      title="Interactive map unavailable"
      description="This browser could not create a WebGL2 context, which MapLibre GL JS needs, so the map library was not downloaded. Try another browser or turn on hardware acceleration."
    />
  )
}

/** Covers the map until its first draw. The only status region the viewer owns while loading. */
export function MapLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-muted/60 text-sm text-muted-foreground">
      <Spinner label="Loading map" />
      <span aria-hidden="true">Loading map…</span>
    </div>
  )
}

export interface MapFailureProps {
  error: MapInitError
  onRetry: () => void
}

/** Covers the map when it could not start. Reloading is offered where retrying cannot help. */
export function MapFailure({ error, onRetry }: MapFailureProps) {
  if (error.kind === 'webgl2-unavailable') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background p-4">
        <MapUnavailable />
      </div>
    )
  }

  // A failed dynamic import is cached by the browser for the page’s lifetime, so only a reload
  // can fetch the library again.
  const needsReload = error.kind === 'import-failed'
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background p-4">
      <ErrorState
        icon={<MapPinOff />}
        title={needsReload ? 'The map library could not be loaded' : 'The map could not start'}
        description={
          needsReload
            ? 'Check your connection, then reload the page.'
            : 'Something went wrong while creating the map. Try again, or reload the page.'
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
