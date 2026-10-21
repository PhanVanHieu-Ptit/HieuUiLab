import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTheme } from '@/hooks/use-theme'
import { mockMatchMedia, prefersReducedMotion } from '@/test/media'

import { SceneInitError, type SceneController, type SceneControllerOptions } from './scene-types'
import { ThreeSceneDemo } from './three-scene-demo'

interface Entry {
  controller: { [Method in keyof SceneController]: ReturnType<typeof vi.fn> }
  options: SceneControllerOptions
  signal: AbortSignal
  canvas: HTMLCanvasElement
}

/**
 * Stands in for `scene-controller.ts` and `webgl-support.ts`, so the demo runs without WebGL or
 * Three.js. The stand-in behaves like the real controller in the one way that matters here: a call
 * whose signal was aborted never produces a scene.
 */
const harness = vi.hoisted(() => ({
  supported: true,
  /** When true, a call waits for `release()` instead of settling at once. */
  hold: false,
  /** When true, the stand-in builds a scene even after an abort, to exercise the late-resolve guard. */
  ignoreSignal: false,
  /** Errors for the next calls to reject with, in order. */
  failures: [] as Error[],
  calls: 0,
  /** Controllers that were actually built. */
  entries: [] as Entry[],
  waiting: [] as (() => void)[],
}))

vi.mock('../shared/webgl-support', () => ({
  supportsWebgl2: () => harness.supported,
}))

vi.mock('./scene-controller', () => ({
  createSceneController: (
    canvas: HTMLCanvasElement,
    options: SceneControllerOptions,
    signal: AbortSignal,
  ) =>
    new Promise<SceneController>((resolve, reject) => {
      harness.calls += 1
      const failure = harness.failures.shift()
      const finish = () => {
        if (failure !== undefined) {
          reject(failure)
          return
        }
        if (signal.aborted && !harness.ignoreSignal) {
          reject(new DOMException('Aborted', 'AbortError'))
          return
        }
        const controller = {
          setSelected: vi.fn(),
          moveCamera: vi.fn(),
          resetCamera: vi.fn(),
          setPalette: vi.fn(),
          setReducedMotion: vi.fn(),
          dispose: vi.fn(),
        }
        harness.entries.push({ controller, options, signal, canvas })
        resolve(controller)
      }
      if (harness.hold) harness.waiting.push(finish)
      else queueMicrotask(finish)
    }),
}))

function entryAt(index = 0): Entry {
  const entry = harness.entries[index]
  if (!entry) throw new Error(`No scene was built at index ${String(index)}`)
  return entry
}

function liveControllers(): Entry[] {
  return harness.entries.filter((entry) => entry.controller.dispose.mock.calls.length === 0)
}

async function sceneReady() {
  await waitFor(() => {
    expect(screen.queryByText('Loading 3D scene')).not.toBeInTheDocument()
  })
}

async function renderReady() {
  const view = render(<ThreeSceneDemo />)
  await sceneReady()
  return { ...view, user: userEvent.setup() }
}

function ThemeButtons() {
  const { setTheme } = useTheme()
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTheme('dark')
        }}
      >
        Go dark
      </button>
      <button
        type="button"
        onClick={() => {
          setTheme('system')
        }}
      >
        Follow system
      </button>
    </>
  )
}

beforeEach(() => {
  harness.supported = true
  harness.hold = false
  harness.ignoreSignal = false
  harness.failures.length = 0
  harness.calls = 0
  harness.entries.length = 0
  harness.waiting.length = 0
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('without WebGL2', () => {
  it('explains why there is no scene and never starts one', () => {
    harness.supported = false
    render(<ThreeSceneDemo />)
    expect(screen.getByRole('heading', { name: '3D scene unavailable' })).toBeInTheDocument()
    expect(screen.getByText(/could not create a WebGL2 context/)).toBeInTheDocument()
    expect(harness.calls).toBe(0)
  })

  it('shows no controls that would have nothing to control', () => {
    harness.supported = false
    render(<ThreeSceneDemo />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('starting up', () => {
  it('shows one loading status, and disables the camera, until the scene has drawn', async () => {
    harness.hold = true
    render(<ThreeSceneDemo />)
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByText('Loading 3D scene')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset camera' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()

    await act(async () => {
      harness.waiting.splice(0).forEach((release) => {
        release()
      })
      await Promise.resolve()
    })
    await sceneReady()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset camera' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled()
  })

  it('builds the scene once, on a canvas that has a name and a description', async () => {
    await renderReady()
    expect(harness.calls).toBe(1)
    const canvas = screen.getByRole('img', { name: /3D scene of five solids/ })
    expect(canvas).toBe(entryAt().canvas)
    expect(canvas).toHaveAccessibleDescription(/Drag to orbit/)
  })

  it('hands the scene the page’s palette', async () => {
    await renderReady()
    const { palette } = entryAt().options
    for (const colour of Object.values(palette)) expect(colour).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('lists every solid, and says nothing is selected', async () => {
    await renderReady()
    for (const name of ['Box', 'Cylinder', 'Cone', 'Sphere', 'Torus']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${name}`) })).toBeEnabled()
    }
    expect(screen.getByText(/Nothing is selected/)).toBeInTheDocument()
  })
})

describe('selecting a solid', () => {
  it('selects from the list, tells the scene, and shows what is known about it', async () => {
    const { user } = await renderReady()
    const { controller } = entryAt()

    await user.click(screen.getByRole('button', { name: /^Cone/ }))

    expect(controller.setSelected).toHaveBeenLastCalledWith('cone')
    expect(screen.getByRole('button', { name: /^Cone/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^Box/ })).toHaveAttribute('aria-pressed', 'false')
    const panel = screen.getByRole('region', { name: 'Selected solid' })
    expect(within(panel).getByText('ConeGeometry')).toBeInTheDocument()
    expect(within(panel).getByText('radius 1.2 m, height 3 m')).toBeInTheDocument()
    expect(within(panel).getByText('east 4 m, south -2.5 m')).toBeInTheDocument()
  })

  it('selects from a click on the scene, which the scene reports', async () => {
    await renderReady()
    const { controller, options } = entryAt()

    act(() => {
      options.onPick('sphere')
    })

    expect(screen.getByRole('button', { name: /^Sphere/ })).toHaveAttribute('aria-pressed', 'true')
    expect(controller.setSelected).toHaveBeenLastCalledWith('sphere')
  })

  it('clears from a click on empty ground, and from the Clear button', async () => {
    const { user } = await renderReady()
    const { controller, options } = entryAt()
    act(() => {
      options.onPick('box')
    })
    act(() => {
      options.onPick(null)
    })
    expect(screen.getByText(/Nothing is selected/)).toBeInTheDocument()
    expect(controller.setSelected).toHaveBeenLastCalledWith(null)

    await user.click(screen.getByRole('button', { name: /^Torus/ }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByText(/Nothing is selected/)).toBeInTheDocument()
    expect(controller.setSelected).toHaveBeenLastCalledWith(null)
  })

  it('announces each selection once, politely, and keeps the panel out of the live region', async () => {
    const { user } = await renderReady()
    const announcement = document.querySelector('[aria-live="polite"]')
    expect(announcement).toHaveTextContent('')

    await user.click(screen.getByRole('button', { name: /^Cylinder/ }))
    expect(announcement).toHaveTextContent('Selected Cylinder.')
    expect(announcement).not.toContainElement(
      screen.getByRole('region', { name: 'Selected solid' }),
    )
  })

  it('ignores an id the scene has no data for', async () => {
    await renderReady()
    act(() => {
      entryAt().options.onPick('missing')
    })
    expect(screen.getByText(/Nothing is selected/)).toBeInTheDocument()
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('')
  })
})

describe('the camera buttons', () => {
  it.each([
    ['Orbit left', 'orbit-left'],
    ['Orbit right', 'orbit-right'],
    ['Raise camera', 'raise'],
    ['Lower camera', 'lower'],
    ['Zoom in', 'zoom-in'],
    ['Zoom out', 'zoom-out'],
  ])('moves the camera when %s is pressed', async (name, move) => {
    const { user } = await renderReady()
    await user.click(screen.getByRole('button', { name }))
    expect(entryAt().controller.moveCamera).toHaveBeenCalledExactlyOnceWith(move)
  })

  it('resets the camera from the button', async () => {
    const { user } = await renderReady()
    await user.click(screen.getByRole('button', { name: 'Reset camera' }))
    expect(entryAt().controller.resetCamera).toHaveBeenCalledTimes(1)
  })

  it('are grouped under one name for screen readers', async () => {
    await renderReady()
    const group = screen.getByRole('group', { name: 'Camera' })
    expect(within(group).getAllByRole('button')).toHaveLength(7)
  })
})

describe('renderer stats', () => {
  it('shows nothing measured until the scene first goes quiet', async () => {
    await renderReady()
    expect(screen.getByText('Draw calls in the last frame').nextElementSibling).toHaveTextContent(
      '–',
    )
  })

  it('shows the counters the scene reports, and updates them', async () => {
    await renderReady()
    act(() => {
      entryAt().options.onIdle({
        drawCalls: 7,
        triangles: 5200,
        geometries: 7,
        textures: 0,
        frames: 3,
      })
    })
    const value = (label: string) => screen.getByText(label).nextElementSibling
    expect(value('Draw calls in the last frame')).toHaveTextContent('7')
    expect(value('Triangles in the last frame')).toHaveTextContent('5200')
    expect(value('Geometries on the GPU')).toHaveTextContent('7')
    expect(value('Textures on the GPU')).toHaveTextContent('0')
    expect(value('Frames drawn so far')).toHaveTextContent('3')

    act(() => {
      entryAt().options.onIdle({
        drawCalls: 7,
        triangles: 5200,
        geometries: 7,
        textures: 0,
        frames: 4,
      })
    })
    expect(value('Frames drawn so far')).toHaveTextContent('4')
  })

  it('is a disclosure the visitor can leave closed', async () => {
    await renderReady()
    expect(screen.getByText('Renderer stats').closest('details')).not.toHaveAttribute('open')
  })
})

describe('the graphics context', () => {
  it('says so when the context is lost, and stops saying so when it returns', async () => {
    await renderReady()
    act(() => {
      entryAt().options.onContextChange(true)
    })
    expect(screen.getByText('The graphics context was lost')).toBeInTheDocument()
    act(() => {
      entryAt().options.onContextChange(false)
    })
    expect(screen.queryByText('The graphics context was lost')).not.toBeInTheDocument()
  })
})

describe('lifecycle', () => {
  it('disposes the scene once on unmount, after aborting its signal', async () => {
    const { unmount } = await renderReady()
    const { controller, signal } = entryAt()
    expect(signal.aborted).toBe(false)
    unmount()
    expect(signal.aborted).toBe(true)
    expect(controller.dispose).toHaveBeenCalledTimes(1)
  })

  it('does not rebuild the scene when the visitor changes things', async () => {
    const { user } = await renderReady()
    await user.click(screen.getByRole('button', { name: /^Cone/ }))
    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    act(() => {
      entryAt().options.onPick('torus')
    })
    act(() => {
      entryAt().options.onIdle({
        drawCalls: 1,
        triangles: 1,
        geometries: 1,
        textures: 0,
        frames: 2,
      })
    })
    act(() => {
      entryAt().options.onContextChange(true)
    })
    expect(harness.calls).toBe(1)
    expect(entryAt().controller.dispose).not.toHaveBeenCalled()
  })

  it('leaves exactly one live scene under StrictMode’s mount, unmount, mount', async () => {
    render(
      <StrictMode>
        <ThreeSceneDemo />
      </StrictMode>,
    )
    await sceneReady()
    expect(harness.calls).toBe(2)
    expect(harness.entries).toHaveLength(1)
    expect(liveControllers()).toHaveLength(1)
  })

  it('disposes a scene that arrives after the page has gone, even if the builder ignored the abort', async () => {
    harness.ignoreSignal = true
    harness.hold = true
    const { unmount } = render(<ThreeSceneDemo />)
    unmount()
    await act(async () => {
      harness.waiting.splice(0).forEach((release) => {
        release()
      })
      await Promise.resolve()
    })
    expect(harness.entries).toHaveLength(1)
    expect(liveControllers()).toHaveLength(0)
  })

  it('leaves no scene alive after unmount under StrictMode', async () => {
    const { unmount } = render(
      <StrictMode>
        <ThreeSceneDemo />
      </StrictMode>,
    )
    await sceneReady()
    unmount()
    expect(liveControllers()).toHaveLength(0)
  })
})

describe('theme and motion', () => {
  it('repaints the existing scene when the theme changes', async () => {
    const user = userEvent.setup()
    render(
      <>
        <ThreeSceneDemo />
        <ThemeButtons />
      </>,
    )
    await sceneReady()
    const { controller } = entryAt()
    const before = controller.setPalette.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Go dark' }))
    expect(controller.setPalette.mock.calls.length).toBeGreaterThan(before)
    expect(harness.calls).toBe(1)
    expect(controller.dispose).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Follow system' }))
  })

  it('tells the scene whether the system asks for reduced motion', async () => {
    await renderReady()
    expect(entryAt().controller.setReducedMotion).toHaveBeenLastCalledWith(false)
  })

  it('tells the scene when the system asks for reduced motion', async () => {
    mockMatchMedia(prefersReducedMotion)
    await renderReady()
    expect(entryAt().controller.setReducedMotion).toHaveBeenLastCalledWith(true)
  })
})

describe('when the scene cannot start', () => {
  it('offers Retry for a failed start, and a fresh scene on a fresh canvas replaces the failure', async () => {
    harness.failures.push(new SceneInitError('init-failed', 'The 3D scene could not be created.'))
    const { user } = await renderReady()
    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('The 3D scene could not start')).toBeInTheDocument()
    expect(harness.entries).toHaveLength(0)
    const failedCanvas = screen.getByRole('img')

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
    await sceneReady()
    expect(harness.calls).toBe(2)
    expect(harness.entries).toHaveLength(1)
    // A canvas whose context a failed renderer touched is not reused.
    expect(entryAt().canvas).not.toBe(failedCanvas)
    expect(screen.getByRole('img')).toBe(entryAt().canvas)
  })

  it('offers only a reload when the 3D code could not be downloaded', async () => {
    harness.failures.push(
      new SceneInitError('import-failed', 'The 3D code could not be downloaded.'),
    )
    await renderReady()
    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('The 3D code could not be loaded')).toBeInTheDocument()
    expect(within(alert).queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    expect(within(alert).getByRole('button', { name: 'Reload page' })).toBeInTheDocument()
  })

  it('treats an error of an unknown kind as a failed start', async () => {
    harness.failures.push(new Error('Something else'))
    await renderReady()
    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('The 3D scene could not start')).toBeInTheDocument()
  })

  it('does not report a failure that arrives after the page has gone', async () => {
    harness.hold = true
    harness.failures.push(new SceneInitError('init-failed', 'The 3D scene could not be created.'))
    const { unmount } = render(<ThreeSceneDemo />)
    unmount()
    await act(async () => {
      harness.waiting.splice(0).forEach((release) => {
        release()
      })
      await Promise.resolve()
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('brings a scene started after Retry up to date with what the visitor chose meanwhile', async () => {
    harness.failures.push(new SceneInitError('init-failed', 'The 3D scene could not be created.'))
    const { user } = await renderReady()
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: /^Sphere/ }))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => {
      expect(harness.entries).toHaveLength(1)
    })
    await waitFor(() => {
      expect(entryAt().controller.setSelected).toHaveBeenLastCalledWith('sphere')
    })
  })
})
