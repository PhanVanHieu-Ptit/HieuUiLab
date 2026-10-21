import { useCallback, useState, type Dispatch } from 'react'

import { createMapController } from './map-controller'
import { MapInitError, type MapController } from './map-types'
import { readMapPalette } from './theme-colors'
import { INITIAL_VISIBILITY, type ViewerAction } from './viewer-state'

export type MapPhase =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready' }
  | { readonly kind: 'error'; readonly error: MapInitError }

function toInitError(error: unknown): MapInitError {
  if (error instanceof MapInitError) return error
  return new MapInitError('init-failed', 'The map could not be created.', { cause: error })
}

/**
 * Owns one map's lifetime. The returned `containerRef` goes on a div that has no React children
 * and a class name that never changes, because MapLibre writes its own classes and elements into
 * it.
 *
 * The callback ref is what builds the map, and it closes over nothing but `dispatch`, which is
 * stable. No prop or piece of state can change its identity, so React never runs its cleanup for
 * a reason other than the div leaving the page: the map is never recreated because something
 * else changed. State flows to the map afterwards, through the effects in `MapViewer`.
 *
 * Cleanup aborts the signal first. Under StrictMode (mount, unmount, mount) the first mount is
 * aborted before the library has arrived, so only the second one builds a map.
 */
export function useMapController(dispatch: Dispatch<ViewerAction>) {
  const [controller, setController] = useState<MapController | null>(null)
  const [phase, setPhase] = useState<MapPhase>({ kind: 'loading' })
  const [contextLost, setContextLost] = useState(false)
  // Changing this remounts the container, which is how Retry gets a fresh element.
  const [attempt, setAttempt] = useState(0)

  const containerRef = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container) return
      const abort = new AbortController()
      let live: MapController | null = null
      dispatch({ type: 'mapReset' })

      createMapController(
        container,
        {
          palette: readMapPalette(),
          visibility: INITIAL_VISIBILITY,
          onFeatureClick: (ref) => {
            dispatch(ref ? { type: 'select', ref } : { type: 'clearSelection' })
          },
          onLayerStatus: (statuses) => {
            dispatch({ type: 'layerStatus', statuses })
          },
          onBasemapReady: () => {
            dispatch({ type: 'basemapReady' })
          },
          onBasemapFailed: (message) => {
            dispatch({ type: 'basemapFailed', message })
          },
          onContextChange: setContextLost,
        },
        abort.signal,
      ).then(
        (created) => {
          if (abort.signal.aborted) {
            created.dispose()
            return
          }
          live = created
          setController(created)
          setPhase({ kind: 'ready' })
        },
        (error: unknown) => {
          // An aborted mount is not a failure: the page moved on before the map was built.
          if (abort.signal.aborted) return
          setPhase({ kind: 'error', error: toInitError(error) })
        },
      )

      return () => {
        abort.abort()
        live?.dispose()
        live = null
        setController(null)
        setContextLost(false)
      }
    },
    [dispatch],
  )

  const retry = useCallback(() => {
    setPhase({ kind: 'loading' })
    setAttempt((count) => count + 1)
  }, [])

  return { containerRef, controller, phase, contextLost, attempt, retry }
}
