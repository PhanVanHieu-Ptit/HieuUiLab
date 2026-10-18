import { describe, expect, it } from 'vitest'

import { highlightCode } from './highlight'

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
