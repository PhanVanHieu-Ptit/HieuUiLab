import { describe, expect, it } from 'vitest'

import { parseAttrs } from './attributes'

describe('parseAttrs', () => {
  it('reads quoted key/value pairs in order', () => {
    expect(parseAttrs('slug="data-table" part="DataTable"')).toEqual({
      attrs: { slug: 'data-table', part: 'DataTable' },
    })
  })

  it('accepts an empty string and an empty value', () => {
    expect(parseAttrs('')).toEqual({ attrs: {} })
    expect(parseAttrs('  ')).toEqual({ attrs: {} })
    expect(parseAttrs('title=""')).toEqual({ attrs: { title: '' } })
  })

  it('keeps spaces and punctuation inside a value', () => {
    expect(parseAttrs('title="src/lib/cn.ts (helper)"')).toEqual({
      attrs: { title: 'src/lib/cn.ts (helper)' },
    })
  })

  it.each([
    ['an unquoted value', 'slug=button'],
    ['single quotes', "slug='button'"],
    ['a bare word', 'button'],
    ['a missing separator', 'a="1"b="2"'],
    ['an unterminated value', 'slug="button'],
    ['an uppercase key', 'Slug="button"'],
    ['trailing text', 'slug="button" extra'],
  ])('rejects %s', (_, source) => {
    expect(parseAttrs(source)).toHaveProperty('error')
  })

  it('rejects a key given twice', () => {
    expect(parseAttrs('a="1" a="2"')).toEqual({ error: 'attribute "a" is given twice' })
  })
})
