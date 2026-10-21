import { describe, expect, it, vi } from 'vitest'

import { createSceneController } from './scene-controller'
import { SceneInitError } from './scene-types'
import { FALLBACK_TOKENS, derivePalette } from './theme-colors'

// The 3D code fails to download: a dynamic import that rejects, as on a dropped connection. The
// first attempt fails and a later one succeeds, as when the connection comes back.
const attempts = vi.hoisted(() => ({ count: 0, create: vi.fn(() => ({ id: 'scene' })) }))

vi.mock('./runtime/scene-runtime', () => {
  attempts.count += 1
  if (attempts.count === 1) throw new Error('Failed to fetch dynamically imported module')
  return { createSceneRuntime: attempts.create }
})

function options() {
  return {
    palette: derivePalette(FALLBACK_TOKENS),
    onPick: vi.fn(),
    onContextChange: vi.fn(),
    onIdle: vi.fn(),
  }
}

describe('when the 3D code cannot be downloaded', () => {
  it('rejects with an import failure and builds nothing', async () => {
    const failure = createSceneController(
      document.createElement('canvas'),
      options(),
      new AbortController().signal,
    )
    await expect(failure).rejects.toBeInstanceOf(SceneInitError)
    await expect(failure).rejects.toMatchObject({ kind: 'import-failed' })
    expect(attempts.create).not.toHaveBeenCalled()
  })

  it('tries the download again on the next call, instead of remembering the failure', async () => {
    const scene = await createSceneController(
      document.createElement('canvas'),
      options(),
      new AbortController().signal,
    )
    expect(scene).toEqual({ id: 'scene' })
    expect(attempts.count).toBe(2)
  })
})
