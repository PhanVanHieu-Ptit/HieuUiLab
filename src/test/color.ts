// WCAG contrast arithmetic for tests: the design tokens are OKLCH in globals.css, and code is
// highlighted with hex colors, so both are turned into relative luminance and compared.

export type Oklch = readonly [l: number, c: number, h: number]
export type Tokens = Record<string, Oklch>

/** Read the `--name: oklch(l c h)` declarations from the first block of `css` matching `selector`. */
export function readTokens(css: string, selector: string): Tokens {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`No "${selector}" block in globals.css`)
  const body = css.slice(start, css.indexOf('}', start))
  const tokens: Tokens = {}
  for (const [, name = '', value = ''] of body.matchAll(/--([\w-]+):\s*oklch\(([^)]+)\)/g)) {
    const [l = 0, c = 0, h = 0] = value.trim().split(/\s+/).map(Number)
    tokens[name] = [l, c, h]
  }
  return tokens
}

/** The tokens each theme resolves to. The light tokens are declared on `.light`, which `.dark` overrides. */
export function themeTokens(css: string): { light: Tokens; dark: Tokens } {
  const light = readTokens(css, '.light')
  return { light, dark: { ...light, ...readTokens(css, '.dark') } }
}

/** OKLCH → linear sRGB (clamped to gamut) → WCAG relative luminance. */
export function luminance([l, c, h]: Oklch): number {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (x: number) => Math.min(1, Math.max(0, x))
  const r = clamp(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_)
  const g = clamp(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_)
  const bl = clamp(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_)
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl
}

/** WCAG relative luminance of `#rrggbb`. */
export function hexLuminance(hex: string): number {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex)
  if (!match) throw new Error(`Not a #rrggbb color: ${hex}`)
  const [r = 0, g = 0, b = 0] = match.slice(1).map((part) => {
    const channel = parseInt(part, 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio of two relative luminances. */
export function contrastOfLuminances(x: number, y: number): number {
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

export function contrast(x: Oklch, y: Oklch): number {
  return contrastOfLuminances(luminance(x), luminance(y))
}
