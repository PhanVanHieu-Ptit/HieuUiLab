import { PerspectiveCamera, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import {
  FAR,
  FOV_DEGREES,
  HOME_POSE,
  LIMITS,
  NEAR,
  TARGET,
  easeOutCubic,
  flightProgress,
  lerpPose,
  movePose,
  poseFromPosition,
  poseToPosition,
  type CameraPose,
} from '../camera-config'
import { createRenderScheduler } from '../render-scheduler'
import type { SceneController, SceneControllerOptions, SceneStats } from '../scene-types'
import { disposeObject3D } from './dispose'
import { LAYERS, buildScene, type SceneLayer } from './layers'
import { pickAt } from './picking'

/** A phone's third pixel buys no visible detail and costs half again as many pixels to fill. */
const MAX_PIXEL_RATIO = 2
/** A press that moves farther than this is a drag, not a click. */
const CLICK_SLOP_PX = 4
const DAMPING_FACTOR = 0.1

interface Flight {
  readonly from: CameraPose
  readonly to: CameraPose
  /** Set by the first frame of the flight, so it starts at the time it is first drawn. */
  start: number | null
}

/**
 * Build one scene on `canvas`: the renderer, the camera and its controls, and the layers. This and
 * the files beside it are the only code that imports Three.js.
 *
 * Rules this file keeps:
 * - It draws only when something changed. Nothing is requested from the browser while the scene is
 *   still, and a flight or an easing camera keeps asking for frames only until it arrives.
 * - Each resource is released by a cleanup registered right after it is created, and cleanups run
 *   in the opposite order. A scene that fails halfway through starting releases what it had.
 * - Disposal is idempotent, and the controller does nothing after it.
 * - The canvas belongs to React: it is never created or removed here.
 */
export function createSceneRuntime(
  canvas: HTMLCanvasElement,
  options: SceneControllerOptions,
  layers: readonly SceneLayer[] = LAYERS,
): SceneController {
  const cleanups: (() => void)[] = []
  const runCleanups = () => {
    for (let cleanup = cleanups.pop(); cleanup; cleanup = cleanups.pop()) {
      try {
        cleanup()
      } catch {
        // One failing release must not stop the others.
      }
    }
  }

  try {
    const renderer = new WebGLRenderer({ canvas, antialias: true })
    // `dispose` does not lose the context. The browser caps live contexts, so a page that is
    // visited again and again would otherwise start to lose the oldest ones. Cleanups run last
    // to first, so the context is lost only after the renderer has been disposed.
    cleanups.push(() => {
      renderer.forceContextLoss()
    })
    cleanups.push(() => {
      renderer.dispose()
    })

    const built = buildScene(layers, options.palette)
    // While the renderer is still alive, because disposing is what deletes the GPU objects.
    cleanups.push(() => {
      disposeObject3D(built.scene)
    })

    const camera = new PerspectiveCamera(FOV_DEGREES, 1, NEAR, FAR)
    const [x, y, z] = poseToPosition(HOME_POSE)
    camera.position.set(x, y, z)

    // Registered before the controls, so it runs first: the controls zoom on every wheel event and
    // swallow the page's scroll, so a plain wheel must be stopped before they see it. A Ctrl or ⌘
    // wheel is what a trackpad pinch sends too.
    const guardWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) event.stopImmediatePropagation()
    }
    canvas.addEventListener('wheel', guardWheel, { passive: true })
    cleanups.push(() => {
      canvas.removeEventListener('wheel', guardWheel)
    })

    const controls = new OrbitControls(camera, canvas)
    cleanups.push(() => {
      controls.dispose()
    })
    controls.target.set(TARGET[0], TARGET[1], TARGET[2])
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = DAMPING_FACTOR
    controls.minDistance = LIMITS.minDistance
    controls.maxDistance = LIMITS.maxDistance
    controls.minPolarAngle = LIMITS.minPolar
    controls.maxPolarAngle = LIMITS.maxPolar
    controls.update()

    let reducedMotion = false
    let flight: Flight | null = null
    /** Where the last toolbar press is heading, so quick presses add up instead of restarting. */
    let goal: CameraPose | null = null

    const currentPose = () =>
      poseFromPosition([camera.position.x, camera.position.y, camera.position.z])

    const applyPose = (pose: CameraPose) => {
      const [px, py, pz] = poseToPosition(pose)
      camera.position.set(px, py, pz)
    }

    const draw = () => {
      renderer.render(built.scene, camera)
    }

    function readStats(): SceneStats {
      const { render, memory } = renderer.info
      return {
        drawCalls: render.calls,
        triangles: render.triangles,
        geometries: memory.geometries,
        textures: memory.textures,
        frames: render.frame,
      }
    }

    /** Move the camera along the flight. Returns whether it is still under way. */
    const advanceFlight = (now: number): boolean => {
      if (!flight) return false
      flight.start ??= now
      const progress = flightProgress(flight.start, now)
      applyPose(lerpPose(flight.from, flight.to, easeOutCubic(progress)))
      if (progress < 1) return true
      flight = null
      goal = null
      return false
    }

    const scheduler = createRenderScheduler({
      frame(now) {
        const wasFlying = flight !== null
        const stillFlying = advanceFlight(now)
        // Updating the controls applies a flight's new position and carries on any easing after a
        // drag. It reports whether the camera moved, which the flight's own last step always does.
        const moved = controls.update()
        draw()
        return stillFlying || (!wasFlying && moved)
      },
      onIdle() {
        options.onIdle(readStats())
      },
    })
    cleanups.push(() => {
      scheduler.dispose()
    })

    const invalidate = () => {
      scheduler.invalidate()
    }
    controls.addEventListener('change', invalidate)
    controls.addEventListener('end', invalidate)
    cleanups.push(() => {
      controls.removeEventListener('change', invalidate)
      controls.removeEventListener('end', invalidate)
    })

    /** Fit the drawing buffer to the canvas. Returns false while the canvas has no size. */
    const fitToCanvas = (): boolean => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (width === 0 || height === 0) return false
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO))
      // `false`: the canvas is sized by its container's CSS, not by the renderer.
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      return true
    }

    // Resizing clears the drawing buffer, so the new size is drawn in the same task. Waiting for
    // the next animation frame would paint one blank frame on every resize.
    const observer = new ResizeObserver(() => {
      if (fitToCanvas()) draw()
    })
    observer.observe(canvas)
    cleanups.push(() => {
      observer.disconnect()
    })

    // A click selects, but a drag that ends over a solid must not.
    const pointers = new Set<number>()
    let press: { readonly id: number; readonly x: number; readonly y: number } | null = null

    const onPointerDown = (event: PointerEvent) => {
      // A drag takes over from a flight.
      flight = null
      goal = null
      pointers.add(event.pointerId)
      press =
        pointers.size === 1 && event.button === 0
          ? { id: event.pointerId, x: event.clientX, y: event.clientY }
          : null
    }
    const onPointerUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId)
      const start = press
      press = null
      if (start?.id !== event.pointerId) return
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_SLOP_PX) return
      const box = canvas.getBoundingClientRect()
      if (box.width === 0 || box.height === 0) return
      const px = ((event.clientX - box.left) / box.width) * 2 - 1
      const py = -(((event.clientY - box.top) / box.height) * 2 - 1)
      options.onPick(pickAt(px, py, camera, built.pickables))
    }
    const onPointerCancel = (event: PointerEvent) => {
      pointers.delete(event.pointerId)
      press = null
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerCancel)
    cleanups.push(() => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerCancel)
    })

    // Three.js handles the loss itself (it cancels the event so the browser may restore the
    // context, and sets everything up again when it does). These only tell the page.
    const onContextLost = () => {
      options.onContextChange(true)
    }
    const onContextRestored = () => {
      options.onContextChange(false)
      scheduler.invalidate()
    }
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    cleanups.push(() => {
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
    })

    // The first frame is drawn here, so a renderer that cannot draw fails the start.
    fitToCanvas()
    draw()

    const flyTo = (pose: CameraPose) => {
      if (reducedMotion) {
        flight = null
        goal = null
        applyPose(pose)
        controls.update()
        scheduler.invalidate()
        return
      }
      goal = pose
      flight = { from: currentPose(), to: pose, start: null }
      scheduler.invalidate()
    }

    let disposed = false
    options.onIdle(readStats())

    return {
      setSelected(id) {
        if (disposed) return
        built.setSelected(id)
        scheduler.invalidate()
      },
      moveCamera(move) {
        if (disposed) return
        flyTo(movePose(goal ?? currentPose(), move))
      },
      resetCamera() {
        if (disposed) return
        flyTo(HOME_POSE)
      },
      setPalette(palette) {
        if (disposed) return
        built.setPalette(palette)
        scheduler.invalidate()
      },
      setReducedMotion(reduced) {
        if (disposed) return
        reducedMotion = reduced
        // Inertia is motion the visitor did not ask for.
        controls.enableDamping = !reduced
        if (reduced && flight) flyTo(flight.to)
      },
      dispose() {
        if (disposed) return
        disposed = true
        runCleanups()
      },
    }
  } catch (error) {
    runCleanups()
    throw error
  }
}
