import { beforeAll, describe, expect, it } from 'vitest'

import { registry } from '@/registry'
import { isImplemented } from '@/registry/types'
import css from '@/styles/globals.css?raw'
import { contrastOfLuminances, hexLuminance, luminance, themeTokens } from '@/test/color'
import { listFiles, readFile } from '@/test/repo-files'

import { highlightCode, type HighlightLanguage } from './highlight'

describe('highlightCode', () => {
  it('returns Shiki markup with both theme colors for tsx', async () => {
    const html = await highlightCode('const a = <b />', 'tsx')
    expect(html).toContain('class="shiki')
    expect(html).toContain('--shiki-dark')
  })

  it('loads the json grammar on first use and highlights it', async () => {
    const html = await highlightCode('{ "paths": { "@/*": ["./src/*"] } }', 'json')
    expect(html).toContain('class="shiki')
    // The key gets its own colored span, which unhighlighted text would not.
    expect(html).toMatch(/--shiki-dark:#[0-9a-f]+">"paths"<\/span>/i)
  })

  it('leaves the <pre> out of the tab order, since the code block scrolls as a region', async () => {
    expect(await highlightCode('const a = 1', 'tsx')).not.toContain('tabindex')
  })

  it('loads the css grammar and highlights it', async () => {
    const html = await highlightCode('.dark { --background: oklch(0.16 0.012 260); }', 'css')
    expect(html).toContain('class="shiki')
    expect(html).toContain('--shiki-dark')
  })

  it('reads ts with the tsx grammar, so no second grammar is loaded for it', async () => {
    const source = 'export const answer: number = 42'
    expect(await highlightCode(source, 'ts')).toBe(await highlightCode(source, 'tsx'))
  })

  it('can be asked for the same grammar again', async () => {
    const [first, second] = await Promise.all([
      highlightCode('{"a":1}', 'json'),
      highlightCode('{"a":1}', 'json'),
    ])
    expect(second).toBe(first)
  })
})

/**
 * The code the site shows: every highlighted fence in the docs and the notes, and every registry
 * example and source. What a page displays is what is checked, not a list written to match.
 */
function displayedCode(): { code: string; language: HighlightLanguage }[] {
  const samples: { code: string; language: HighlightLanguage }[] = []
  const files = [...listFiles('src/docs/content/'), ...listFiles('src/notes/content/')]
  for (const file of files) {
    const fence = /^```(tsx|ts|json|css)\b[^\n]*\n([\s\S]*?)^```/gm
    for (const [, language = 'tsx', code = ''] of (readFile(file) ?? '').matchAll(fence)) {
      samples.push({ code, language: language as HighlightLanguage })
    }
  }
  for (const entry of registry.filter(isImplemented)) {
    samples.push({ code: entry.source, language: 'tsx' })
    for (const example of entry.examples) samples.push({ code: example.code, language: 'tsx' })
  }
  return samples
}

describe('syntax colors', () => {
  // Shiki's own themes are not the site's tokens, so tokens.test.ts cannot see them; axe found
  // four of them under 4.5:1 on the code background. The colors are read from the markup the
  // highlighter really produces for the code above, in both themes.
  const colors = { light: new Set<string>(), dark: new Set<string>() }
  const tokens = themeTokens(css)

  beforeAll(async () => {
    for (const { code, language } of displayedCode()) {
      const html = await highlightCode(code, language)
      for (const [, hex = ''] of html.matchAll(/[";]color:(#[\da-f]{6})/gi)) {
        colors.light.add(hex.toLowerCase())
      }
      for (const [, hex = ''] of html.matchAll(/--shiki-dark:(#[\da-f]{6})/gi)) {
        colors.dark.add(hex.toLowerCase())
      }
    }
  }, 120_000)

  it.each(['light', 'dark'] as const)(
    'every %s color on the code background meets 4.5:1',
    (theme) => {
      const code = tokens[theme].code
      if (!code) throw new Error(`--code is not defined in the ${theme} theme`)
      const background = luminance(code)

      // Enough of the grammar was exercised for the check to mean something.
      expect(colors[theme].size).toBeGreaterThanOrEqual(8)
      const failing = [...colors[theme]]
        .map((hex) => ({ hex, ratio: contrastOfLuminances(hexLuminance(hex), background) }))
        .filter(({ ratio }) => ratio < 4.5)
        .map(({ hex, ratio }) => `${hex} is ${ratio.toFixed(2)}:1`)
      expect(failing).toEqual([])
    },
  )
})
