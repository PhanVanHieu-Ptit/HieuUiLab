import { describe, expect, it } from 'vitest'

import css from './globals.css?raw'

type Oklch = readonly [l: number, c: number, h: number]
type Tokens = Record<string, Oklch>

/** Read the `--name: oklch(l c h)` declarations from the first block matching `selector`. */
function readTokens(selector: string): Tokens {
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

/** OKLCH → linear sRGB (clamped to gamut) → WCAG relative luminance. */
function luminance([l, c, h]: Oklch): number {
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

function contrast(x: Oklch, y: Oklch): number {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p)
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05)
}

const light = readTokens(':root')
const themes = { light, dark: { ...light, ...readTokens('.dark') } }

// [foreground, background] pairs used for text.
const textPairs: [string, string][] = [
  ['foreground', 'background'],
  ['surface-foreground', 'surface'],
  ['code-foreground', 'code'],
  ['popover-foreground', 'popover'],
  ['muted-foreground', 'popover'],
  ...['background', 'surface', 'muted'].flatMap((bg) =>
    ['muted-foreground', 'primary', 'destructive', 'success', 'warning', 'info'].map(
      (fg): [string, string] => [fg, bg],
    ),
  ),
  ...[
    'primary',
    'primary-subtle',
    'secondary',
    'accent',
    'destructive',
    'success',
    'warning',
    'info',
  ].map((fill): [string, string] => [`${fill}-foreground`, fill]),
]
// [foreground, background, minimum ratio]
const cases: [string, string, number][] = [
  ...textPairs.map(([fg, bg]): [string, string, number] => [fg, bg, 4.5]),
  // Focus rings are non-text UI: WCAG 1.4.11 asks for 3:1.
  ...['background', 'surface', 'popover', 'muted'].map((bg): [string, string, number] => [
    'ring',
    bg,
    3,
  ]),
]

describe.each(Object.entries(themes))('%s theme tokens', (_, tokens) => {
  it.each(cases)('%s on %s meets %d:1', (fg, bg, min) => {
    const a = tokens[fg]
    const b = tokens[bg]
    expect(a, `--${fg} is defined`).toBeDefined()
    expect(b, `--${bg} is defined`).toBeDefined()
    if (!a || !b) return
    expect(contrast(a, b)).toBeGreaterThanOrEqual(min)
  })
})

describe('token names', () => {
  it('never reuse a color name for another utility namespace', () => {
    // `--text-code` alongside `--color-code` once made `text-code` paint text in the code
    // background color. Utilities sharing a prefix with colors must not collide.
    const colors = new Set([...css.matchAll(/--color-([\w-]+):/g)].map(([, name]) => name))
    const clashes = [...css.matchAll(/--(text|border|outline|ring|shadow)-([\w-]+?):/g)]
      .map(([, , name]) => name)
      .filter((name) => name !== undefined && colors.has(name))
    expect(clashes).toEqual([])
  })
})
