import { SceneInitError, type SceneController, type SceneControllerOptions } from './scene-types'

/**
 * The only module that loads the Three.js code. Everything under `runtime/` imports `three`, and
 * this file reaches it through one dynamic `import()`, so the library is a chunk of its own that
 * no other page downloads. `import-boundary.test.ts` keeps it that way.
 *
 * Rules this file keeps:
 * - One scene per call, and none at all if the caller aborts first, so React StrictMode's
 *   mount-unmount-mount never builds two.
 * - A failed download is forgotten, so Retry can try again.
 */

const importRuntime = () => import('./runtime/scene-runtime')
type RuntimeModule = Awaited<ReturnType<typeof importRuntime>>

let loading: Promise<RuntimeModule> | undefined

function loadRuntime(): Promise<RuntimeModule> {
  loading ??= importRuntime().catch((cause: unknown) => {
    loading = undefined
    throw new SceneInitError('import-failed', 'The 3D code could not be downloaded.', { cause })
  })
  return loading
}

function abortError(): DOMException {
  return new DOMException('The scene was torn down before it finished loading.', 'AbortError')
}

/**
 * Download the renderer, then build one scene on `canvas`. Rejects with an `AbortError` if `signal`
 * fires first, and with a `SceneInitError` if the code cannot be downloaded or the renderer or its
 * first frame cannot be created.
 */
export async function createSceneController(
  canvas: HTMLCanvasElement,
  options: SceneControllerOptions,
  signal: AbortSignal,
): Promise<SceneController> {
  const runtime = await loadRuntime()
  // The check that keeps StrictMode honest: an aborted mount stops here, before any scene exists.
  if (signal.aborted) throw abortError()
  try {
    return runtime.createSceneRuntime(canvas, options)
  } catch (cause) {
    throw new SceneInitError('init-failed', 'The 3D scene could not be created.', { cause })
  }
}
