import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSceneController } from './scene-controller'
import { SceneInitError, type SceneController, type SceneControllerOptions } from './scene-types'
import { FALLBACK_TOKENS, derivePalette } from './theme-colors'

// The renderer module is replaced, so this exercises only what the controller decides: when to
// build a scene, when not to, and how a failure is described.
const runtime = vi.hoisted(() => ({
  create: vi.fn(),
}))

vi.mock('./runtime/scene-runtime', () => ({
  createSceneRuntime: runtime.create,
}))

function fakeController(): SceneController {
  return {
    setSelected: vi.fn(),
    moveCamera: vi.fn(),
    resetCamera: vi.fn(),
    setPalette: vi.fn(),
    setReducedMotion: vi.fn(),
    dispose: vi.fn(),
  }
}

let canvas: HTMLCanvasElement
let options: SceneControllerOptions

beforeEach(() => {
  runtime.create.mockReset()
  runtime.create.mockImplementation(fakeController)
  canvas = document.createElement('canvas')
  options = {
    palette: derivePalette(FALLBACK_TOKENS),
    onPick: vi.fn(),
    onContextChange: vi.fn(),
    onIdle: vi.fn(),
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('createSceneController', () => {
  it('builds one scene on the canvas, with the options it was given', async () => {
    const controller = await createSceneController(canvas, options, new AbortController().signal)

    expect(runtime.create).toHaveBeenCalledTimes(1)
    expect(runtime.create).toHaveBeenCalledWith(canvas, options)
    expect(controller).toBe(runtime.create.mock.results[0]?.value)
  })

  it('builds nothing, and rejects with an AbortError, if it is aborted before the code arrives', async () => {
    const abort = new AbortController()
    const pending = createSceneController(canvas, options, abort.signal)
    abort.abort()

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(runtime.create).not.toHaveBeenCalled()
  })

  it('builds exactly one scene when a mount is torn down and mounted again', async () => {
    // What React StrictMode does: the first mount is aborted before anything has arrived.
    const first = new AbortController()
    const firstScene = createSceneController(canvas, options, first.signal)
    first.abort()
    const secondScene = createSceneController(canvas, options, new AbortController().signal)

    await expect(firstScene).rejects.toMatchObject({ name: 'AbortError' })
    await expect(secondScene).resolves.toBeDefined()
    expect(runtime.create).toHaveBeenCalledTimes(1)
  })

  it('describes a renderer that cannot start as an init failure, keeping the cause', async () => {
    const cause = new Error('Error creating WebGL context.')
    runtime.create.mockImplementation(() => {
      throw cause
    })

    const failure = createSceneController(canvas, options, new AbortController().signal)

    await expect(failure).rejects.toBeInstanceOf(SceneInitError)
    await expect(failure).rejects.toMatchObject({ kind: 'init-failed', cause })
  })

  it('can try again after a renderer failed to start', async () => {
    runtime.create.mockImplementationOnce(() => {
      throw new Error('Out of GPU memory.')
    })
    await expect(
      createSceneController(canvas, options, new AbortController().signal),
    ).rejects.toMatchObject({ kind: 'init-failed' })

    await expect(
      createSceneController(canvas, options, new AbortController().signal),
    ).resolves.toBeDefined()
  })

  it('gives each call its own scene', async () => {
    const [a, b] = await Promise.all([
      createSceneController(
        document.createElement('canvas'),
        options,
        new AbortController().signal,
      ),
      createSceneController(
        document.createElement('canvas'),
        options,
        new AbortController().signal,
      ),
    ])
    expect(a).not.toBe(b)
    expect(runtime.create).toHaveBeenCalledTimes(2)
  })
})
