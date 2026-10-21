import { afterEach, describe, expect, it, vi } from 'vitest'

import { resetWebgl2Probe, supportsWebgl2 } from './webgl-support'

afterEach(() => {
  vi.restoreAllMocks()
  resetWebgl2Probe()
})

function stubContext(context: unknown) {
  return vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue(context as ReturnType<HTMLCanvasElement['getContext']>)
}

describe('supportsWebgl2', () => {
  it('is false where no WebGL2 context can be made, as in jsdom', () => {
    expect(supportsWebgl2()).toBe(false)
  })

  it('is true when a context exists, and releases it at once', () => {
    const loseContext = vi.fn()
    const spy = stubContext({ getExtension: () => ({ loseContext }) })
    expect(supportsWebgl2()).toBe(true)
    expect(spy).toHaveBeenCalledWith('webgl2')
    expect(loseContext).toHaveBeenCalledTimes(1)
  })

  it('is true even when the browser offers no way to release the context', () => {
    stubContext({ getExtension: () => null })
    expect(supportsWebgl2()).toBe(true)
  })

  it('is false when asking for a context throws', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(supportsWebgl2()).toBe(false)
  })

  it('asks once and remembers the answer', () => {
    const spy = stubContext({ getExtension: () => null })
    supportsWebgl2()
    supportsWebgl2()
    supportsWebgl2()
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
