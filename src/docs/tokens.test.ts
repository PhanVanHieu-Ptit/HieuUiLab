import { describe, expect, it } from 'vitest'

import css from '@/styles/globals.css?raw'

import { tokenDocs, utilityDocs } from './token-docs'
import { parseDesignTokens } from './tokens'

const fixture = `
@import 'tailwindcss';
/* A comment with { braces } and a --fake-token: value; */
:root,
.light {
  --radius: 0.5rem;
  --z-header: 40;
  --background: oklch(0.99 0 0);
  --elevation-raised:
    0 1px 2px 0 oklch(0 0 0 / 0.06), 0 1px 3px 0 oklch(0 0 0 / 0.08);
  --mystery: 1;
}
.dark {
  --background: oklch(0.16 0 0);
  --elevation-raised: 0 1px 2px 0 oklch(0 0 0 / 0.3);
  --dark-only: 2;
}
@theme inline {
  --color-background: var(--background);
  --shadow-raised: var(--elevation-raised);
  --radius-sm: calc(var(--radius) - 2px);
}
@theme {
  --font-sans: 'IBM Plex Sans Variable', sans-serif;
  --text-title: 2rem;
  --text-title--line-height: 1.15;
  --spacing-gutter: 1rem;
  --animate-fade-in: fade-in 150ms ease-out;

  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
}
@utility focus-ring {
  outline: 2px none var(--ring);
}
`

describe('parseDesignTokens', () => {
  const parsed = parseDesignTokens(fixture)
  const token = (name: string) => parsed.tokens.find((item) => item.name === name)

  it('reads a themed color with its light and dark values', () => {
    expect(token('background')).toEqual({
      name: 'background',
      group: 'color',
      light: 'oklch(0.99 0 0)',
      dark: 'oklch(0.16 0 0)',
      parts: {},
    })
  })

  it('collapses multi-line values', () => {
    expect(token('elevation-raised')?.light).toBe(
      '0 1px 2px 0 oklch(0 0 0 / 0.06), 0 1px 3px 0 oklch(0 0 0 / 0.08)',
    )
    expect(token('elevation-raised')?.dark).toBe('0 1px 2px 0 oklch(0 0 0 / 0.3)')
  })

  it('groups the rest by name', () => {
    expect(token('radius')?.group).toBe('radius')
    expect(token('radius-sm')).toMatchObject({
      group: 'radius',
      light: 'calc(var(--radius) - 2px)',
    })
    expect(token('z-header')?.group).toBe('stacking')
    expect(token('font-sans')).toMatchObject({
      group: 'typography',
      light: "'IBM Plex Sans Variable', sans-serif",
    })
    expect(token('spacing-gutter')?.group).toBe('layout')
    expect(token('animate-fade-in')?.group).toBe('motion')
  })

  it('attaches companion variables to their base token', () => {
    expect(token('text-title')?.parts).toEqual({ 'line-height': '1.15' })
    expect(token('text-title--line-height')).toBeUndefined()
  })

  it('does not mistake the contents of a nested rule for tokens', () => {
    expect(parsed.tokens.map((item) => item.name)).not.toContain('opacity')
    expect(token('fade-in')).toBeUndefined()
  })

  it('ignores comments', () => {
    expect(token('fake-token')).toBeUndefined()
  })

  it('lists @utility rules by name', () => {
    expect(parsed.utilities).toEqual(['focus-ring'])
  })

  it('reports variables no group claims instead of dropping them silently', () => {
    expect(parsed.unclassified).toEqual(['mystery', 'dark-only'])
  })
})

describe('the design tokens in globals.css', () => {
  const parsed = parseDesignTokens(css)

  it('are all classified', () => {
    expect(parsed.unclassified).toEqual([])
  })

  it('have a usage description in token-docs.ts, and token-docs.ts describes nothing else', () => {
    expect(parsed.tokens.map((token) => token.name).sort()).toEqual(Object.keys(tokenDocs).sort())
  })

  it('have a description for every @utility rule, and no other', () => {
    expect([...parsed.utilities].sort()).toEqual(Object.keys(utilityDocs).sort())
  })

  it('include every color pair the contrast test relies on', () => {
    const colors = new Set(
      parsed.tokens.filter((token) => token.group === 'color').map((token) => token.name),
    )
    for (const name of ['foreground', 'background', 'primary', 'primary-foreground', 'ring']) {
      expect(colors.has(name), name).toBe(true)
    }
  })

  it('give every color a dark value', () => {
    for (const token of parsed.tokens.filter((item) => item.group === 'color')) {
      expect(token.dark, token.name).toBeDefined()
    }
  })
})
