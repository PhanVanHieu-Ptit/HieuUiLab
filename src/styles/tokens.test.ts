import { describe, expect, it } from 'vitest'

import { contrast, themeTokens } from '@/test/color'

import css from './globals.css?raw'

const themes = themeTokens(css)

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
