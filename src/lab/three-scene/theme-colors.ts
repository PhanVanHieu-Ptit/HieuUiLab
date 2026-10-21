/**
 * Scene colours that follow the site theme.
 *
 * The site's tokens are oklch, which Three.js's colour parser does not read, so each token is
 * resolved to sRGB through a 1×1 canvas, as the map viewer does. Everything else is mixed from
 * those four colours, so a theme change only needs the tokens read again.
 */

export interface SceneTokens {
  background: string
  foreground: string
  primary: string
  warning: string
}

export interface ScenePalette {
  /** The clear colour behind the scene. */
  background: string
  ground: string
  grid: string
  solid: string
  /** The selected solid. */
  selection: string
}

/** Used when a token cannot be resolved, for example where 2D canvas is missing. */
export const FALLBACK_TOKENS: SceneTokens = {
  background: '#ffffff',
  foreground: '#171717',
  primary: '#4f46e5',
  warning: '#b45309',
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

export function derivePalette(tokens: SceneTokens): ScenePalette {
  return {
    background: tokens.background,
    ground: mixHex(tokens.foreground, tokens.background, 0.1),
    grid: mixHex(tokens.foreground, tokens.background, 0.28),
    solid: tokens.primary,
    selection: tokens.warning,
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

const TOKEN_VARIABLES: Readonly<Record<keyof SceneTokens, string>> = {
  background: '--background',
  foreground: '--foreground',
  primary: '--primary',
  warning: '--warning',
}

export function readSceneTokens(root: HTMLElement = document.documentElement): SceneTokens {
  const style = getComputedStyle(root)
  const read = (name: keyof SceneTokens): string => {
    const value = style.getPropertyValue(TOKEN_VARIABLES[name]).trim()
    return (value === '' ? null : cssColorToHex(value)) ?? FALLBACK_TOKENS[name]
  }
  return {
    background: read('background'),
    foreground: read('foreground'),
    primary: read('primary'),
    warning: read('warning'),
  }
}

/** The palette for the theme that is applied right now. */
export function readScenePalette(root?: HTMLElement): ScenePalette {
  return derivePalette(readSceneTokens(root))
}
