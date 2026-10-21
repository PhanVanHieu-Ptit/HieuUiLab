import type { CameraMove } from './camera-config'
import type { ScenePalette } from './theme-colors'

/**
 * The contract between the React layer and the Three.js layer. This file has no runtime import of
 * Three.js, so React code and tests can use these types and `SceneInitError` without the library.
 */

/**
 * `import-failed`: the Three.js chunk could not be downloaded. `init-failed`: it arrived, but the
 * renderer or the first frame could not be created. A browser without WebGL2 is not an error here:
 * the probe in `shared/webgl-support.ts` catches it before anything is downloaded.
 */
export type SceneInitErrorKind = 'import-failed' | 'init-failed'

export class SceneInitError extends Error {
  readonly kind: SceneInitErrorKind

  constructor(kind: SceneInitErrorKind, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'SceneInitError'
    this.kind = kind
  }
}

/** What the renderer reports about the last frame and the GPU objects it holds. Counts, not timings. */
export interface SceneStats {
  /** Draw calls in the last frame. */
  readonly drawCalls: number
  /** Triangles drawn in the last frame. */
  readonly triangles: number
  /** Geometries uploaded to the GPU. */
  readonly geometries: number
  /** Textures uploaded to the GPU. */
  readonly textures: number
  /** Frames drawn since the renderer was created. It stops rising when nothing changes. */
  readonly frames: number
}

export interface SceneControllerOptions {
  readonly palette: ScenePalette
  /** A solid was clicked (its id) or the empty ground was (`null`). */
  readonly onPick: (id: string | null) => void
  /** The graphics context was lost (`true`) or came back (`false`). */
  readonly onContextChange: (lost: boolean) => void
  /** The scene finished drawing a burst of frames and went quiet. Called once per burst. */
  readonly onIdle: (stats: SceneStats) => void
}

/** The imperative handle for one live scene. All methods are safe to call after `dispose`. */
export interface SceneController {
  setSelected: (id: string | null) => void
  moveCamera: (move: CameraMove) => void
  resetCamera: () => void
  setPalette: (palette: ScenePalette) => void
  /** With reduced motion the camera has no inertia and moves to its destination at once. */
  setReducedMotion: (reduced: boolean) => void
  dispose: () => void
}
