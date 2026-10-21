import { useCallback, useState } from 'react'

import { createSceneController } from './scene-controller'
import { SceneInitError, type SceneController, type SceneStats } from './scene-types'
import { readScenePalette } from './theme-colors'

export type ScenePhase =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready' }
  | { readonly kind: 'error'; readonly error: SceneInitError }

function toInitError(error: unknown): SceneInitError {
  if (error instanceof SceneInitError) return error
  return new SceneInitError('init-failed', 'The 3D scene could not be created.', { cause: error })
}

/**
 * Owns one scene's lifetime. The returned `canvasRef` goes on a `<canvas>` whose identity changes
 * only with `attempt`, because the renderer takes the canvas over and loses its context with it.
 *
 * The callback ref is what builds the scene, and it closes over nothing but `onPick`, which the
 * caller keeps stable. No prop or piece of state can change its identity, so React never runs its
 * cleanup for a reason other than the canvas leaving the page: the scene is never rebuilt because
 * something else changed. State flows to the scene afterwards, through the effects in the viewer.
 *
 * Cleanup aborts the signal first. Under StrictMode (mount, unmount, mount) the first mount is
 * aborted before the renderer has arrived, so only the second one builds a scene.
 */
export function useSceneController(onPick: (id: string | null) => void) {
  const [controller, setController] = useState<SceneController | null>(null)
  const [phase, setPhase] = useState<ScenePhase>({ kind: 'loading' })
  const [contextLost, setContextLost] = useState(false)
  const [stats, setStats] = useState<SceneStats | null>(null)
  // Changing this remounts the canvas, which is how Retry gets a fresh element.
  const [attempt, setAttempt] = useState(0)

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return
      const abort = new AbortController()
      let live: SceneController | null = null

      createSceneController(
        canvas,
        {
          palette: readScenePalette(),
          onPick,
          onContextChange: setContextLost,
          onIdle: setStats,
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
          // An aborted mount is not a failure: the page moved on before the scene was built.
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
        setStats(null)
      }
    },
    [onPick],
  )

  const retry = useCallback(() => {
    setPhase({ kind: 'loading' })
    setAttempt((count) => count + 1)
  }, [])

  return { canvasRef, controller, phase, contextLost, stats, attempt, retry }
}
