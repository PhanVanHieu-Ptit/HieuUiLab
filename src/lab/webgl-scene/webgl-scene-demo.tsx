import { MonitorX, Pause, Play } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { EmptyState } from '@/components/blocks/empty-state'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useTheme } from '@/hooks/use-theme'

import { createScene, cssColorToRgb, type Scene } from './scene'

/** Radians per millisecond. */
const SPEED = 0.0006

function subscribeToVisibility(listener: () => void) {
  document.addEventListener('visibilitychange', listener)
  return () => {
    document.removeEventListener('visibilitychange', listener)
  }
}

function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeToVisibility,
    () => document.visibilityState === 'visible',
    () => true,
  )
}

/** A lit cube in raw WebGL2 that only animates when it should. */
export function WebglSceneDemo() {
  const reducedMotion = useReducedMotion()
  const { resolvedTheme } = useTheme()
  const pageVisible = usePageVisible()
  const [scene, setScene] = useState<Scene | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [inView, setInView] = useState(true)
  // null until the user chooses; until then reduced motion decides.
  const [playPreference, setPlayPreference] = useState<boolean | null>(null)
  const playing = playPreference ?? !reducedMotion
  const angle = useRef(0.6)

  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return
    const created = createScene(canvas, {
      onContextLost: () => {
        setUnavailable(true)
      },
    })
    if (!created) {
      setUnavailable(true)
      return
    }
    setScene(created)

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            if (entry) setInView(entry.isIntersecting)
          })
    observer?.observe(canvas)

    return () => {
      observer?.disconnect()
      created.dispose()
      setScene(null)
    }
  }, [])

  // Follow the theme's primary colour. The `dark` class is already applied when this runs.
  useEffect(() => {
    if (!scene) return
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    const rgb = primary ? cssColorToRgb(primary) : null
    if (rgb) scene.setColor(rgb)
  }, [scene, resolvedTheme])

  useEffect(() => {
    if (!scene) return
    scene.render(angle.current)
    if (!playing || !inView || !pageVisible) return

    let frame = 0
    let last: number | null = null
    const tick = (now: number) => {
      if (last !== null) angle.current += (now - last) * SPEED
      last = now
      scene.render(angle.current)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [scene, playing, inView, pageVisible])

  if (unavailable) {
    return (
      <EmptyState
        icon={<MonitorX />}
        title="WebGL is unavailable"
        description="This browser could not create a WebGL2 context, or the graphics driver dropped it. Try another browser or turn on hardware acceleration."
      />
    )
  }

  let status = 'Rotating. Pauses automatically when off-screen or in a background tab.'
  if (!playing) {
    status =
      playPreference === null
        ? 'Paused because your system asks for reduced motion.'
        : 'Paused. The scene shows a still frame.'
  }

  return (
    <figure className="flex flex-col gap-3">
      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted/40">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A shaded cube in the site’s primary colour"
          className="block size-full"
        />
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{status}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPlayPreference(!playing)
          }}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {playing ? 'Pause rotation' : 'Play rotation'}
        </Button>
      </figcaption>
    </figure>
  )
}
