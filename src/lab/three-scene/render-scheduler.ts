export interface RenderSchedulerOptions {
  /** Draw one frame. Return true if another frame is needed, for example while the camera is still moving. */
  readonly frame: (now: number) => boolean
  /** Called once each time the scheduler stops asking for frames. */
  readonly onIdle?: () => void
  readonly requestFrame?: (callback: FrameRequestCallback) => number
  readonly cancelFrame?: (handle: number) => void
}

export interface RenderScheduler {
  /** Ask for a frame. Any number of calls before the frame runs cost one frame. */
  invalidate: () => void
  /** Cancel a pending frame and ignore all later calls. */
  dispose: () => void
}

/**
 * Draws on demand instead of on every animation frame. Something that changes the picture calls
 * `invalidate`, and the frame runs once. If the frame says it is not finished (a camera that is
 * still easing), the next one is requested; when it says it is, the scheduler goes quiet and no
 * `requestAnimationFrame` is outstanding until the next `invalidate`.
 *
 * `invalidate` is ignored while a frame is running. The frame's return value is the only way to ask
 * for the next one, because the camera controls announce a change from inside the frame that is
 * already drawing it, and honouring that would add one redundant frame to the end of every burst.
 */
export function createRenderScheduler({
  frame,
  onIdle,
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (handle) => {
    cancelAnimationFrame(handle)
  },
}: RenderSchedulerOptions): RenderScheduler {
  let handle: number | null = null
  let running = false
  let disposed = false

  function run(now: number) {
    handle = null
    running = true
    let again = false
    try {
      again = frame(now)
    } finally {
      running = false
    }
    if (disposed) return
    if (again) handle = requestFrame(run)
    else onIdle?.()
  }

  return {
    invalidate() {
      if (disposed || running || handle !== null) return
      handle = requestFrame(run)
    },
    dispose() {
      disposed = true
      if (handle !== null) cancelFrame(handle)
      handle = null
    },
  }
}
