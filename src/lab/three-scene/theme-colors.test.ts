import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  FALLBACK_TOKENS,
  cssColorToHex,
  derivePalette,
  mixHex,
  readSceneTokens,
  type SceneTokens,
} from './theme-colors'

afterEach(() => {
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('style')
})

describe('mixHex', () => {
  it('returns the second colour at 0 and the first at 1', () => {
    expect(mixHex('#ff0000', '#0000ff', 0)).toBe('#0000ff')
    expect(mixHex('#ff0000', '#0000ff', 1)).toBe('#ff0000')
  })

  it('blends in sRGB in between', () => {
    expect(mixHex('#ffffff', '#000000', 0.5)).toBe('#808080')
  })

  it('stays inside the colour range', () => {
    expect(mixHex('#ffffff', '#000000', 2)).toBe('#ffffff')
    expect(mixHex('#ffffff', '#000000', -1)).toBe('#000000')
  })
})

describe('derivePalette', () => {
  const tokens: SceneTokens = {
    background: '#ffffff',
    foreground: '#000000',
    primary: '#336699',
    warning: '#cc8800',
  }

  it('uses the page background behind the scene, the primary colour for solids, and warning for the selection', () => {
    const palette = derivePalette(tokens)
    expect(palette.background).toBe('#ffffff')
    expect(palette.solid).toBe('#336699')
    expect(palette.selection).toBe('#cc8800')
  })

  it('makes the ground a faint tint and the grid lines stronger than the ground', () => {
    const palette = derivePalette(tokens)
    expect(palette.ground).toBe('#e6e6e6')
    expect(palette.grid).toBe('#b8b8b8')
  })

  it('follows a dark theme: a dark page gives a dark ground that is lighter than the page', () => {
    const palette = derivePalette({ ...tokens, background: '#000000', foreground: '#ffffff' })
    expect(palette.ground).toBe('#1a1a1a')
    expect(palette.grid).toBe('#474747')
  })
})

describe('cssColorToHex', () => {
  it('gives up where there is no 2D canvas, as in jsdom', () => {
    expect(cssColorToHex('oklch(0.5 0.19 264)')).toBeNull()
  })

  it('resolves a colour by painting it, and rejects syntax the canvas ignores', () => {
    const context = {
      fillStyle: '',
      fillRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([79, 70, 229, 255]) })),
    }
    // A real canvas reads back a normalised colour once it has accepted one. This stand-in always
    // reports that it did, whatever was assigned.
    Object.defineProperty(context, 'fillStyle', {
      get: () => 'resolved',
      set: () => undefined,
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    )
    expect(cssColorToHex('oklch(0.5 0.19 264)')).toBe('#4f46e5')
  })

  it('treats a colour left at the sentinel as unsupported', () => {
    const context = { fillRect: vi.fn(), getImageData: vi.fn() }
    // A real canvas ignores a colour it cannot parse and keeps the one it had.
    Object.defineProperty(context, 'fillStyle', {
      get: () => '#010203',
      set: () => undefined,
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    )
    expect(cssColorToHex('not-a-colour')).toBeNull()
    expect(context.fillRect).not.toHaveBeenCalled()
  })
})

describe('readSceneTokens', () => {
  it('falls back to built-in colours where the tokens cannot be resolved', () => {
    expect(readSceneTokens()).toEqual(FALLBACK_TOKENS)
  })
})
