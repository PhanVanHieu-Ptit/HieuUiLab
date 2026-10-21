import { TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useId, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useTheme } from '@/hooks/use-theme'

import { supportsWebgl2 } from '../shared/webgl-support'
import type { CameraMove } from './camera-config'
import { getSolid } from './scene-data'
import { CameraToolbar, RendererStats, SolidInfo, SolidList } from './scene-panels'
import { readScenePalette } from './theme-colors'
import { useSceneController } from './use-scene-controller'
import { SceneFailure, SceneLoading, SceneUnavailable } from './viewer-states'

/**
 * A Three.js scene of five solids on a grid, with orbit controls and selection. React holds what
 * the visitor chose; the scene follows it, and it is built once per mount.
 */
export function ThreeSceneDemo() {
  // Probed once, before Three.js is imported: a browser that cannot run it never fetches it.
  const [supported] = useState(supportsWebgl2)
  const [selected, setSelected] = useState<string | null>(null)
  const helpId = useId()
  const reducedMotion = useReducedMotion()
  const { resolvedTheme } = useTheme()

  // Stable, because the scene is built by a callback ref that closes over it.
  const pick = useCallback((id: string | null) => {
    setSelected(id)
  }, [])
  const { canvasRef, controller, phase, contextLost, stats, attempt, retry } =
    useSceneController(pick)

  // The effects below only push what the visitor chose into the scene. They depend on
  // `controller`, so a fresh scene (after Retry) is brought up to date, and none of them can
  // build a new one.
  useEffect(() => {
    controller?.setSelected(selected)
  }, [controller, selected])

  // The `dark` class is already on <html> when this runs, so the tokens read back are the new ones.
  useEffect(() => {
    controller?.setPalette(readScenePalette())
  }, [controller, resolvedTheme])

  useEffect(() => {
    controller?.setReducedMotion(reducedMotion)
  }, [controller, reducedMotion])

  const moveCamera = useCallback(
    (move: CameraMove) => {
      controller?.moveCamera(move)
    },
    [controller],
  )
  const resetCamera = useCallback(() => {
    controller?.resetCamera()
  }, [controller])
  const clearSelection = useCallback(() => {
    setSelected(null)
  }, [])

  if (!supported) return <SceneUnavailable />

  const selectedName = selected ? (getSolid(selected)?.name ?? null) : null

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <figure className="flex min-w-0 flex-col gap-3">
        <div className="relative h-96 overflow-hidden rounded-lg border bg-muted/40 sm:h-120 lg:h-144">
          {/* The renderer takes this canvas over, so its identity changes only when Retry asks for a new one. */}
          <canvas
            key={attempt}
            ref={canvasRef}
            role="img"
            aria-label="A 3D scene of five solids standing on a grid"
            aria-describedby={helpId}
            className="block size-full"
          />
          {phase.kind === 'loading' ? <SceneLoading /> : null}
          {phase.kind === 'error' ? <SceneFailure error={phase.error} onRetry={retry} /> : null}
        </div>
        {contextLost ? (
          <Alert variant="warning">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>The graphics context was lost</AlertTitle>
            <AlertDescription>
              The browser dropped the scene’s GPU context. It usually comes back by itself; if the
              scene stays blank, reload the page.
            </AlertDescription>
          </Alert>
        ) : null}
        <CameraToolbar disabled={controller === null} onMove={moveCamera} onReset={resetCamera} />
        <figcaption id={helpId} className="text-sm text-pretty text-muted-foreground">
          Drag to orbit and click a solid to select it. The page scrolls as usual over the scene;
          hold Ctrl or ⌘ while scrolling, or pinch on a trackpad, to zoom. On a touch screen a
          finger on the scene orbits it instead of scrolling the page, and the buttons above move
          the camera too.
        </figcaption>
      </figure>

      <aside aria-label="Scene details" className="flex min-w-0 flex-col gap-4">
        <SolidInfo selected={selected} onClear={clearSelection} />
        <SolidList selected={selected} onSelect={setSelected} />
        <RendererStats stats={stats} />
      </aside>

      {/* One polite announcement per selection; the panel itself is not a live region. */}
      <p className="sr-only" aria-live="polite">
        {selectedName ? `Selected ${selectedName}.` : ''}
      </p>
    </div>
  )
}
