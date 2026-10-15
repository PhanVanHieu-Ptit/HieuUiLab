import { describe, expect, it } from 'vitest'

import { jsxAttribute, jsxText, playgroundJsx } from './playground'

// JSX decodes `&amp;` to `&`, but React shows a string prop or child as written, so text that
// looks like an entity has to be written as an expression for the code to match the preview.
describe('entities in generated JSX', () => {
  it('writes text that looks like an entity as an expression', () => {
    expect(jsxText('Fish &amp; chips')).toBe('{"Fish &amp; chips"}')
    expect(jsxText('&#169; 2026')).toBe('{"&#169; 2026"}')
    expect(jsxText('&#xA9;')).toBe('{"&#xA9;"}')
    expect(jsxText('R&D;')).toBe('{"R&D;"}')
    expect(jsxAttribute('title', '&lt;b&gt;')).toBe('title={"&lt;b&gt;"}')
  })

  it('leaves a bare ampersand alone', () => {
    expect(jsxText('Fish & chips')).toBe('Fish & chips')
    expect(jsxText('R&D')).toBe('R&D')
    expect(jsxAttribute('title', 'a & b')).toBe('title="a & b"')
  })

  it('applies to whole elements', () => {
    expect(playgroundJsx('Button', [['children', 'Save &amp; close']])).toBe(
      '<Button>{"Save &amp; close"}</Button>',
    )
  })
})
