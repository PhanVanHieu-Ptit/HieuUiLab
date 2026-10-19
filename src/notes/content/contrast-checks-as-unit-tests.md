# Checking colour contrast in a unit test

## Context and problem

Components in the lab draw their colors from semantic tokens such as `--foreground`, `--muted-foreground`, and `--primary`, declared once in `src/styles/globals.css` for a light and a dark theme. That is convenient for theming, and it creates a risk: one edit to one token value can make text hard to read in every place that token is used, and nothing about the edit looks wrong in a diff.

Contrast problems usually surface late, in an audit or a complaint. The aim here is to make a palette tweak that hurts legibility fail a test on the same day, in the same pull request, without opening a browser.

## Constraints

The tests run in jsdom, which has no layout engine and does not resolve CSS custom properties through a cascade, so the check cannot ask the page what color a piece of text ends up with. It has to work from the stylesheet text.

The tokens are written in OKLCH, which contrast formulas do not accept directly, so each value needs converting to a color space where luminance can be computed. The project should not take on a color library for one test. Both themes have to be covered, and the dark theme only overrides some of the light tokens, so the rest are inherited. The check also has to fail loudly when the stylesheet changes shape, so that it does not quietly check nothing.

## Approach and alternatives considered

Three alternatives were considered.

1. **An accessibility engine in a real browser.** This checks the rendered page, including colors that come from composition. The repository has no such engine, and its testing page says so, so this would be a new dependency and a slower test.
2. **Computed styles from the running page in a Playwright test.** An end-to-end test does check that colors change between themes, but it compares only the body background, the body text, and the header border, and it does not measure contrast.
3. **Read the stylesheet as text, convert, and assert on pairs of tokens.** This is fast, has no new dependency, and covers every pair in the list on every run.

The third option was chosen. Vite is configured to process CSS only for `?raw` imports, so the test can import `globals.css` as a string. The test finds the `.light` and `.dark` blocks, reads the `oklch(l c h)` declarations, converts each value to linear sRGB, and reduces it to relative luminance. Because components use semantic tokens, checking the token pairs covers much of the text on the site.

## Implementation example

Reading tokens is a small function that throws if the block is missing and slices to the first closing brace, so it cannot read past the block it was asked about.

```ts title="src/styles/tokens.test.ts (reading the tokens)"
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
```

The conversion follows the published OKLab matrices, clamps the result to the sRGB gamut, and weights the channels into a luminance. The ratio is the lighter luminance plus a small offset over the darker one plus the same offset.

```ts title="src/styles/tokens.test.ts (the math)"
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
```

The dark theme is the light tokens with the dark overrides on top, and the list of pairs asks for a higher ratio for text than for the focus ring, which is not text.

```ts title="src/styles/tokens.test.ts (the pairs)"
const light = readTokens('.light')
const themes = { light, dark: { ...light, ...readTokens('.dark') } }
// …
const cases: [string, string, number][] = [
  ...textPairs.map(([fg, bg]): [string, string, number] => [fg, bg, 4.5]),
  // Focus rings are non-text UI: WCAG 1.4.11 asks for 3:1.
  ...['background', 'surface', 'popover', 'muted'].map((bg): [string, string, number] => [
    'ring',
    bg,
    3,
  ]),
]
```

## Verification

The test is run with the rest of the unit tests, or alone.

```bash title="Command: run the token contrast test"
pnpm test src/styles/tokens.test.ts
```

A test that passes proves little until it has been seen to fail. While writing this note, the light value of `--muted-foreground` in `src/styles/globals.css` was temporarily lightened, from a lightness of 0.48 to 0.70. Exactly four cases failed, the four pairs that put that token on the background, the surface, the muted fill, and the popover. The value was then restored and the test passed again. That mutation was done by hand once and is not part of the suite.

The conversion constants were compared with the ones published in the OKLab post cited below, and they match.

### What this does not verify

The ratios and thresholds come from the test and its comments. The pages of the W3C specification were requested while writing this note and could not be opened, so the 4.5 and 3 figures and the luminance weights were not re-checked against the specification text. The test knows nothing about opacity modifiers such as a color at half opacity, about text over images or gradients, or about hover, disabled, and selected states that use other tokens. It checks only the pairs in its list, so a new pair of tokens has no coverage until it is added, and nothing checks that components actually use the pairs as listed. It also does not look at rendered pages.

## Trade-offs and lessons learned

Hand-written color math is code the project now maintains. It is small, and it follows a published source, but a mistake in it would make every assertion meaningless, which is why the mutation check mattered more than the first green run.

The pair list is the real contract. It is easy to extend and easy to forget. The token names are the part that makes the approach pay off: with semantic tokens, a short list covers most of the site, and with raw palette colors in components it would not.

A fast first line of defense is not a replacement for checking real pages. The most useful property of the test is its failure message, which names the token pair and the ratio it needed, so the person who changed a value sees what to fix.

## References

- Björn Ottosson's [OKLab post](https://bottosson.github.io/posts/oklab/), opened while writing this note: its `oklab_to_linear_srgb` code publishes the matrices used in `luminance`, and it defines chroma and hue in terms of the `a` and `b` axes.
