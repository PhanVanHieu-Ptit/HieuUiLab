import { describe, expect, it, vi } from 'vitest'

import { createScene } from './scene'

/**
 * A stand-in for WebGL2 that records what is created and deleted. jsdom has no GPU, so this proves
 * the pairing of every create with its delete, not that a real driver frees the memory.
 */
function fakeGl(options: { failFragmentCompile?: boolean } = {}) {
  const created = { shader: 0, program: 0, buffer: 0, vertexArray: 0 }
  const deleted = { shader: 0, program: 0, buffer: 0, vertexArray: 0 }
  const fragments = new Set<object>()
  const overrides: Record<string, unknown> = {
    createShader: (type: number) => {
      created.shader += 1
      const shader = {}
      if (type === FRAGMENT) fragments.add(shader)
      return shader
    },
    getShaderParameter: (shader: object) => !(options.failFragmentCompile && fragments.has(shader)),
    getProgramParameter: () => true,
    createProgram: () => {
      created.program += 1
      return {}
    },
    createBuffer: () => {
      created.buffer += 1
      return {}
    },
    createVertexArray: () => {
      created.vertexArray += 1
      return {}
    },
    deleteShader: () => (deleted.shader += 1),
    deleteProgram: () => (deleted.program += 1),
    deleteBuffer: () => (deleted.buffer += 1),
    deleteVertexArray: () => (deleted.vertexArray += 1),
    isContextLost: () => false,
    getAttribLocation: () => 0,
  }
  const FRAGMENT = 35632
  const gl = new Proxy(
    {},
    {
      get: (_target, name: string) => {
        if (name === 'FRAGMENT_SHADER') return FRAGMENT
        if (name in overrides) return overrides[name]
        // Constants are upper case; every other method does nothing and returns nothing.
        return /^[A-Z_\d]+$/.test(name) ? 1 : vi.fn()
      },
    },
  ) as unknown as WebGL2RenderingContext
  return { gl, created, deleted }
}

function canvasWith(gl: WebGL2RenderingContext): HTMLCanvasElement {
  return {
    getContext: () => gl,
    clientWidth: 100,
    clientHeight: 100,
    width: 100,
    height: 100,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as HTMLCanvasElement
}

describe('createScene', () => {
  it('returns null and frees the shader that did compile when the other does not', () => {
    const { gl, created, deleted } = fakeGl({ failFragmentCompile: true })

    expect(createScene(canvasWith(gl), { onContextLost: vi.fn() })).toBeNull()

    expect(created.shader).toBe(2)
    expect(deleted.shader).toBe(2)
    expect(created.program).toBe(0)
  })

  it('deletes every shader, program, buffer, and vertex array it made when disposed', () => {
    const { gl, created, deleted } = fakeGl()

    const scene = createScene(canvasWith(gl), { onContextLost: vi.fn() })
    expect(scene).not.toBeNull()
    expect(deleted).toEqual({ shader: 0, program: 0, buffer: 0, vertexArray: 0 })

    scene?.dispose()

    expect(created).toEqual({ shader: 2, program: 1, buffer: 3, vertexArray: 1 })
    expect(deleted).toEqual(created)
  })
})
