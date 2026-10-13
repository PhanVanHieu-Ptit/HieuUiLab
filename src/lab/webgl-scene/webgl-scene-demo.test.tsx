import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mockMatchMedia, prefersReducedMotion } from '@/test/media'

import type { Scene } from './scene'
import { WebglSceneDemo } from './webgl-scene-demo'

const scene = vi.hoisted(() => ({
  available: true,
  render: vi.fn(),
  setColor: vi.fn(),
  dispose: vi.fn(),
}))

vi.mock('./scene', () => ({
  createScene: (): Scene | null =>
    scene.available
      ? { render: scene.render, setColor: scene.setColor, dispose: scene.dispose }
      : null,
  cssColorToRgb: () => [0.4, 0.4, 0.9] as const,
}))

let requestFrame: ReturnType<typeof vi.fn>

beforeEach(() => {
  scene.available = true
  scene.render.mockClear()
  scene.dispose.mockClear()
  requestFrame = vi.fn(() => 1)
  vi.stubGlobal('requestAnimationFrame', requestFrame)
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('WebglSceneDemo', () => {
  it('explains when WebGL is unavailable', () => {
    scene.available = false
    render(<WebglSceneDemo />)

    expect(screen.getByRole('heading', { name: 'WebGL is unavailable' })).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('animates by default and can be paused', async () => {
    const user = userEvent.setup()
    render(<WebglSceneDemo />)

    expect(screen.getByRole('img', { name: /shaded cube/ })).toBeInTheDocument()
    expect(requestFrame).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Pause rotation' }))
    expect(screen.getByRole('button', { name: 'Play rotation' })).toBeInTheDocument()
    expect(screen.getByText('Paused. The scene shows a still frame.')).toBeInTheDocument()
  })

  it('starts still under reduced motion until the user presses Play', async () => {
    mockMatchMedia(prefersReducedMotion)
    const user = userEvent.setup()
    render(<WebglSceneDemo />)

    expect(screen.getByText('Paused because your system asks for reduced motion.')).toBeVisible()
    expect(scene.render).toHaveBeenCalled()
    expect(requestFrame).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Play rotation' }))
    expect(requestFrame).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Pause rotation' })).toBeInTheDocument()
  })

  it('releases GPU resources on unmount', () => {
    const { unmount } = render(<WebglSceneDemo />)
    unmount()
    expect(scene.dispose).toHaveBeenCalled()
  })
})
