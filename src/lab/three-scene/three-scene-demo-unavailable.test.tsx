import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ThreeSceneDemo } from './three-scene-demo'

// Neither the WebGL probe nor the controller is mocked here: this is the path every test that
// renders a lab route in jsdom takes. jsdom cannot create a WebGL2 context, so the demo must stop
// before the 3D code is imported.
const library = vi.hoisted(() => ({ loads: 0 }))

vi.mock('three', () => {
  library.loads += 1
  return {}
})
vi.mock('three/addons/controls/OrbitControls.js', () => {
  library.loads += 1
  return {}
})
vi.mock('./runtime/scene-runtime', () => {
  library.loads += 1
  return {}
})

describe('the demo where WebGL2 is missing', () => {
  it('explains that the scene is unavailable', () => {
    render(<ThreeSceneDemo />)
    expect(screen.getByRole('heading', { name: '3D scene unavailable' })).toBeInTheDocument()
    expect(screen.getByText(/could not create a WebGL2 context/)).toBeInTheDocument()
  })

  it('never downloads the 3D code', async () => {
    render(<ThreeSceneDemo />)
    // Give any stray dynamic import time to run before checking.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(library.loads).toBe(0)
  })

  it('shows no controls that would have nothing to control', () => {
    render(<ThreeSceneDemo />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
