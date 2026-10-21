import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  FALLBACK_TOKENS,
  cssColorToHex,
  derivePalette,
  mixHex,
  readMapPalette,
  readPaletteTokens,
} from './theme-colors'

afterEach(() => {
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('style')
})

/** A 2D context whose fill colour is whatever the test says the browser resolved it to. */
function stubCanvas(
  resolve: (css: string) => { fillStyle: string; pixel: [number, number, number] },
) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((kind: string) => {
    if (kind !== '2d') return null
    let current = { fillStyle: '#000000', pixel: [0, 0, 0] as [number, number, number] }
    return {
      set fillStyle(css: string) {
        current = css.startsWith('#') ? { fillStyle: css, pixel: current.pixel } : resolve(css)
      },
      get fillStyle() {
        return current.fillStyle
      },
      fillRect: () => undefined,
      getImageData: () => ({ data: new Uint8ClampedArray([...current.pixel, 255]) }),
    }
  }) as unknown as HTMLCanvasElement['getContext'])
}

describe('mixHex', () => {
  it('returns the second colour at 0 and the first at 1', () => {
    expect(mixHex('#ff0000', '#0000ff', 0)).toBe('#0000ff')
    expect(mixHex('#ff0000', '#0000ff', 1)).toBe('#ff0000')
  })

  it('blends in sRGB', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('always returns a six-digit hex colour', () => {
    expect(mixHex('#102030', '#fefefe', 0.37)).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('derivePalette', () => {
  const light = derivePalette(FALLBACK_TOKENS)
  const dark = derivePalette({
    ...FALLBACK_TOKENS,
    background: '#0a0a0a',
    foreground: '#fafafa',
  })

  it('produces only hex colours MapLibre can parse', () => {
    const colours = [
      light.ocean,
      light.land,
      light.landOutline,
      light.graticule,
      light.zone,
      light.route,
      light.selection,
      light.siteHalo,
      ...Object.values(light.categories),
    ]
    for (const colour of colours) expect(colour).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('keeps the island distinct from the ocean in both themes', () => {
    expect(light.land).not.toBe(light.ocean)
    expect(dark.land).not.toBe(dark.ocean)
  })

  it('follows the theme: a dark background gives a dark ocean', () => {
    const luminance = (hex: string) => Number.parseInt(hex.slice(1, 3), 16)
    expect(luminance(dark.ocean)).toBeLessThan(luminance(light.ocean))
  })

  it('gives each category its own colour', () => {
    expect(new Set(Object.values(light.categories)).size).toBe(4)
  })
})

describe('cssColorToHex', () => {
  it('returns null without a 2D canvas, as in jsdom', () => {
    expect(cssColorToHex('oklch(0.5 0.1 200)')).toBeNull()
  })

  it('reads back the sRGB value the canvas painted', () => {
    stubCanvas(() => ({ fillStyle: '#112233', pixel: [17, 34, 51] }))
    expect(cssColorToHex('oklch(0.5 0.1 200)')).toBe('#112233')
  })

  it('returns null for a colour the canvas does not understand', () => {
    stubCanvas(() => ({ fillStyle: '#010203', pixel: [1, 2, 3] }))
    expect(cssColorToHex('not a colour')).toBeNull()
  })
})

describe('reading the theme', () => {
  it('falls back to the built-in colours where tokens cannot be resolved', () => {
    expect(readPaletteTokens()).toEqual(FALLBACK_TOKENS)
    expect(readMapPalette()).toEqual(derivePalette(FALLBACK_TOKENS))
  })

  it('resolves the site tokens when the canvas can', () => {
    document.documentElement.style.setProperty('--primary', 'oklch(0.5 0.2 270)')
    stubCanvas(() => ({ fillStyle: '#123456', pixel: [18, 52, 86] }))
    expect(readPaletteTokens().primary).toBe('#123456')
  })
})
