// Reads the design tokens out of `src/styles/globals.css` so the tokens page is generated from the
// stylesheet instead of being a second, hand-kept list. Pure: the caller supplies the CSS text.

export const tokenGroups = [
  'color',
  'radius',
  'elevation',
  'stacking',
  'typography',
  'layout',
  'motion',
  'utilities',
] as const

export type TokenGroup = (typeof tokenGroups)[number]

export interface DesignToken {
  /** The CSS variable without its dashes: `primary` for `--primary`. */
  name: string
  group: Exclude<TokenGroup, 'utilities'>
  /** The value in the light theme, or the only value of a theme-independent token. */
  light: string
  /** The value under `.dark`; undefined when the token does not change with the theme. */
  dark: string | undefined
  /** Companion variables such as `line-height` for `--text-title--line-height`, by suffix. */
  parts: Readonly<Record<string, string>>
}

export interface ParsedDesignTokens {
  tokens: DesignToken[]
  /** Names of the `@utility` rules, e.g. `focus-ring`. */
  utilities: string[]
  /** Variables found in a block this parser knows but that no group claims. Should be empty. */
  unclassified: string[]
}

interface Rule {
  prelude: string
  body: string
}

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim()

/** The blocks at the top level of a stylesheet, with their selectors or at-rule preludes. */
function topLevelRules(css: string): Rule[] {
  const rules: Rule[] = []
  let depth = 0
  let prelude = ''
  let bodyStart = 0
  let quote: string | undefined
  for (let index = 0; index < css.length; index++) {
    const char = css.charAt(index)
    if (quote !== undefined) {
      if (char === quote) quote = undefined
      if (depth === 0) prelude += char
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      if (depth === 0) prelude += char
    } else if (char === '{') {
      if (depth === 0) bodyStart = index + 1
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0) {
        rules.push({ prelude: collapse(prelude), body: css.slice(bodyStart, index) })
        prelude = ''
      }
    } else if (depth === 0) {
      // A statement such as `@import 'tailwindcss';` ends here and has no block.
      if (char === ';') prelude = ''
      else prelude += char
    }
  }
  return rules
}

/** `--name: value` declarations written directly in a block, not those of nested rules. */
function declarations(body: string): Map<string, string> {
  const found = new Map<string, string>()
  let depth = 0
  let current = ''
  let quote: string | undefined
  for (let index = 0; index < body.length; index++) {
    const char = body.charAt(index)
    if (quote !== undefined) {
      if (char === quote) quote = undefined
      if (depth === 0) current += char
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      if (depth === 0) current += char
    } else if (char === '{') {
      // What came before a nested block is its selector (`@keyframes x`), not a declaration.
      if (depth === 0) current = ''
      depth++
    } else if (char === '}') {
      depth--
    } else if (depth === 0) {
      if (char === ';') {
        record(current)
        current = ''
      } else {
        current += char
      }
    }
  }
  record(current)

  function record(declaration: string) {
    const colon = declaration.indexOf(':')
    if (colon === -1) return
    const name = declaration.slice(0, colon).trim()
    if (!name.startsWith('--')) return
    found.set(name.slice(2), collapse(declaration.slice(colon + 1)))
  }

  return found
}

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const RADIUS_SCALE = /^radius-(sm|md|lg|xl)$/

/** The design tokens declared in a stylesheet shaped like `src/styles/globals.css`. */
export function parseDesignTokens(css: string): ParsedDesignTokens {
  const rules = topLevelRules(stripComments(css))
  const blockOf = (prelude: string) => rules.find((rule) => rule.prelude === prelude)
  const light = declarations(blockOf(':root, .light')?.body ?? '')
  const dark = declarations(blockOf('.dark')?.body ?? '')
  const inline = declarations(blockOf('@theme inline')?.body ?? '')
  const theme = declarations(blockOf('@theme')?.body ?? '')

  const tokens: DesignToken[] = []
  const unclassified: string[] = []
  const add = (
    name: string,
    group: DesignToken['group'],
    value: string,
    darkValue?: string,
    parts: Record<string, string> = {},
  ) => {
    tokens.push({ name, group, light: value, dark: darkValue, parts })
  }

  // `@theme inline` maps theme variables onto utilities: `--color-x: var(--x)` makes `bg-x`.
  const colors = new Set<string>()
  for (const [name, value] of inline) {
    if (name.startsWith('color-') && value === `var(--${name.slice('color-'.length)})`) {
      colors.add(name.slice('color-'.length))
    }
  }

  for (const [name, value] of light) {
    if (colors.has(name)) add(name, 'color', value, dark.get(name))
    else if (name === 'radius') add(name, 'radius', value)
    else if (name.startsWith('z-')) add(name, 'stacking', value)
    else if (name.startsWith('elevation-')) add(name, 'elevation', value, dark.get(name))
    else unclassified.push(name)
  }
  for (const name of dark.keys()) {
    if (!light.has(name)) unclassified.push(name)
  }

  for (const [name, value] of inline) {
    if (RADIUS_SCALE.test(name)) add(name, 'radius', value)
    else if (!name.startsWith('color-') && !name.startsWith('shadow-')) unclassified.push(name)
  }

  const partsOf = (base: string) => {
    const parts: Record<string, string> = {}
    for (const [name, value] of theme) {
      if (name.startsWith(`${base}--`)) parts[name.slice(base.length + 2)] = value
    }
    return parts
  }

  for (const [name, value] of theme) {
    if (name.includes('--')) continue // a companion of a base token, collected by partsOf
    if (name.startsWith('font-')) add(name, 'typography', value)
    else if (name.startsWith('text-')) add(name, 'typography', value, undefined, partsOf(name))
    else if (name.startsWith('spacing-') || name.startsWith('container-')) {
      add(name, 'layout', value)
    } else if (name.startsWith('animate-')) add(name, 'motion', value)
    else unclassified.push(name)
  }

  const utilities = rules
    .filter((rule) => rule.prelude.startsWith('@utility '))
    .map((rule) => rule.prelude.slice('@utility '.length))

  return { tokens, utilities, unclassified }
}
