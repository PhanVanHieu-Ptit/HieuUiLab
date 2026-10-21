import type { SiteCategory } from './data'

/**
 * Map colours that follow the site theme.
 *
 * MapLibre's colour parser reads hex, rgb, and hsl, but the site's tokens are oklch, so each
 * token is resolved to sRGB through a 1×1 canvas. Everything else is derived by mixing those few
 * colours, so a theme change only needs the tokens read again.
 */

export interface PaletteTokens {
  background: string
  foreground: string
  primary: string
  success: string
  warning: string
  info: string
}

export interface MapPalette {
  ocean: string
  land: string
  landOutline: string
  graticule: string
  /** Neutral colour for zones; the style applies opacity. */
  zone: string
  route: string
  selection: string
  /** A ring around markers so they separate from the land. */
  siteHalo: string
  categories: Readonly<Record<SiteCategory, string>>
}

/** Used when a token cannot be resolved, for example where 2D canvas is missing. */
export const FALLBACK_TOKENS: PaletteTokens = {
  background: '#ffffff',
  foreground: '#171717',
  primary: '#4f46e5',
  success: '#15803d',
  warning: '#b45309',
  info: '#0369a1',
}

type Rgb = readonly [number, number, number]

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function rgbToHex([r, g, b]: Rgb): string {
  const part = (channel: number) =>
    Math.round(Math.min(255, Math.max(0, channel)))
      .toString(16)
      .padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`
}

/** `amount` of `from` mixed into `into`, in sRGB: 0 gives `into`, 1 gives `from`. */
export function mixHex(from: string, into: string, amount: number): string {
  const a = hexToRgb(from)
  const b = hexToRgb(into)
  return rgbToHex([
    b[0] + (a[0] - b[0]) * amount,
    b[1] + (a[1] - b[1]) * amount,
    b[2] + (a[2] - b[2]) * amount,
  ])
}

export function derivePalette(tokens: PaletteTokens): MapPalette {
  const ocean = mixHex(tokens.info, tokens.background, 0.14)
  const land = mixHex(tokens.foreground, tokens.background, 0.1)
  return {
    ocean,
    land,
    landOutline: mixHex(tokens.foreground, land, 0.35),
    graticule: mixHex(tokens.foreground, ocean, 0.1),
    zone: tokens.foreground,
    route: tokens.primary,
    selection: tokens.foreground,
    siteHalo: tokens.background,
    categories: {
      harbour: tokens.info,
      depot: tokens.warning,
      lookout: tokens.success,
      station: tokens.foreground,
    },
  }
}

/**
 * Resolve a CSS colour, including oklch, to `#rrggbb` by painting it on a 1×1 canvas. Returns
 * null when 2D canvas or the colour syntax is unsupported.
 */
export function cssColorToHex(cssColor: string): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  // An unsupported colour is ignored by the canvas, leaving the sentinel in place.
  const sentinel = '#010203'
  context.fillStyle = sentinel
  context.fillStyle = cssColor
  if (context.fillStyle === sentinel) return null
  context.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data
  return rgbToHex([r, g, b])
}

const TOKEN_VARIABLES: Readonly<Record<keyof PaletteTokens, string>> = {
  background: '--background',
  foreground: '--foreground',
  primary: '--primary',
  success: '--success',
  warning: '--warning',
  info: '--info',
}

export function readPaletteTokens(root: HTMLElement = document.documentElement): PaletteTokens {
  const style = getComputedStyle(root)
  const read = (name: keyof PaletteTokens): string => {
    const value = style.getPropertyValue(TOKEN_VARIABLES[name]).trim()
    return (value === '' ? null : cssColorToHex(value)) ?? FALLBACK_TOKENS[name]
  }
  return {
    background: read('background'),
    foreground: read('foreground'),
    primary: read('primary'),
    success: read('success'),
    warning: read('warning'),
    info: read('info'),
  }
}

/** The palette for the theme that is applied right now. */
export function readMapPalette(root?: HTMLElement): MapPalette {
  return derivePalette(readPaletteTokens(root))
}
