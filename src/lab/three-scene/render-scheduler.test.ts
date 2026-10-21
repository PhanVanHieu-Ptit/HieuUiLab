import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createRenderScheduler } from './render-scheduler'

/** A manual animation-frame queue: nothing runs until the test says a frame has arrived. */
function fakeFrames() {
  let next = 1
  const pending = new Map<number, FrameRequestCallback>()
  return {
    requestFrame: vi.fn((callback: FrameRequestCallback) => {
      const handle = next
      next += 1
      pending.set(handle, callback)
      return handle
    }),
    cancelFrame: vi.fn((handle: number) => {
      pending.delete(handle)
    }),
    get pending() {
      return pending.size
    },
    /** Run the oldest pending frame. */
    tick(now = 0) {
      const [handle, callback] = [...pending][0] ?? []
      if (handle === undefined || !callback) throw new Error('No frame was requested.')
      pending.delete(handle)
      callback(now)
    },
  }
}

let frames: ReturnType<typeof fakeFrames>

beforeEach(() => {
  frames = fakeFrames()
})

describe('createRenderScheduler', () => {
  it('requests nothing until something asks for a frame', () => {
    const frame = vi.fn(() => false)
    createRenderScheduler({ frame, ...frames })
    expect(frames.requestFrame).not.toHaveBeenCalled()
    expect(frame).not.toHaveBeenCalled()
  })

  it('turns any number of requests before a frame into one frame', () => {
    const frame = vi.fn(() => false)
    const scheduler = createRenderScheduler({ frame, ...frames })
    scheduler.invalidate()
    scheduler.invalidate()
    scheduler.invalidate()
    expect(frames.requestFrame).toHaveBeenCalledTimes(1)
    frames.tick(16)
    expect(frame).toHaveBeenCalledTimes(1)
    expect(frame).toHaveBeenCalledWith(16)
    expect(frames.pending).toBe(0)
  })

  it('goes quiet when a frame says it is finished, and says so once', () => {
    const onIdle = vi.fn()
    const scheduler = createRenderScheduler({ frame: () => false, onIdle, ...frames })
    scheduler.invalidate()
    expect(onIdle).not.toHaveBeenCalled()
    frames.tick()
    expect(onIdle).toHaveBeenCalledTimes(1)
    expect(frames.pending).toBe(0)
  })

  it('keeps asking for frames for as long as the frame says it is not finished', () => {
    const results = [true, true, false]
    const onIdle = vi.fn()
    const frame = vi.fn(() => results.shift() ?? false)
    const scheduler = createRenderScheduler({ frame, onIdle, ...frames })
    scheduler.invalidate()

    frames.tick()
    frames.tick()
    expect(onIdle).not.toHaveBeenCalled()
    frames.tick()
    expect(frame).toHaveBeenCalledTimes(3)
    expect(onIdle).toHaveBeenCalledTimes(1)
    expect(frames.pending).toBe(0)
  })

  it('draws again after it has gone quiet, when asked', () => {
    const frame = vi.fn(() => false)
    const scheduler = createRenderScheduler({ frame, ...frames })
    scheduler.invalidate()
    frames.tick()
    scheduler.invalidate()
    frames.tick()
    expect(frame).toHaveBeenCalledTimes(2)
  })

  it('ignores a request made from inside the frame, so a burst ends without an extra frame', () => {
    const onIdle = vi.fn()
    const scheduler = createRenderScheduler({
      frame: () => {
        // The camera controls announce their change from inside the frame that draws it.
        scheduler.invalidate()
        return false
      },
      onIdle,
      ...frames,
    })
    scheduler.invalidate()
    frames.tick()
    expect(frames.pending).toBe(0)
    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('leaves nothing pending after dispose, and ignores later requests', () => {
    const frame = vi.fn(() => true)
    const scheduler = createRenderScheduler({ frame, ...frames })
    scheduler.invalidate()
    scheduler.dispose()
    expect(frames.cancelFrame).toHaveBeenCalledTimes(1)
    expect(frames.pending).toBe(0)
    scheduler.invalidate()
    expect(frames.pending).toBe(0)
    expect(frame).not.toHaveBeenCalled()
  })

  it('does not ask for another frame, or report idle, when disposed from inside a frame', () => {
    const onIdle = vi.fn()
    const scheduler = createRenderScheduler({
      frame: () => {
        scheduler.dispose()
        return true
      },
      onIdle,
      ...frames,
    })
    scheduler.invalidate()
    frames.tick()
    expect(frames.pending).toBe(0)
    expect(onIdle).not.toHaveBeenCalled()
  })

  it('can be disposed twice', () => {
    const scheduler = createRenderScheduler({ frame: () => false, ...frames })
    scheduler.dispose()
    expect(() => {
      scheduler.dispose()
    }).not.toThrow()
  })

  it('uses the browser’s animation frames by default', () => {
    const request = vi.fn(() => 7)
    const cancel = vi.fn()
    vi.stubGlobal('requestAnimationFrame', request)
    vi.stubGlobal('cancelAnimationFrame', cancel)
    try {
      const scheduler = createRenderScheduler({ frame: () => false })
      scheduler.invalidate()
      expect(request).toHaveBeenCalledTimes(1)
      scheduler.dispose()
      expect(cancel).toHaveBeenCalledWith(7)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
