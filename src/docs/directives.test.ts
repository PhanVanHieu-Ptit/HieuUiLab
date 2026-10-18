import { describe, expect, it } from 'vitest'

import { directiveShapeError, directiveSpecs, parseDirective } from './directives'

function shape(text: string): string | undefined {
  const parsed = parseDirective(text)
  if ('error' in parsed) return parsed.error
  return directiveShapeError(parsed.directive)
}

describe('parseDirective', () => {
  it('reads a name with attributes', () => {
    expect(parseDirective('::registry-api{slug="data-table" part="DataTable"}')).toEqual({
      directive: { name: 'registry-api', attrs: { slug: 'data-table', part: 'DataTable' } },
    })
  })

  it('reads a name without attributes, with or without braces', () => {
    expect(parseDirective('::theme-switcher')).toEqual({
      directive: { name: 'theme-switcher', attrs: {} },
    })
    expect(parseDirective('::theme-switcher{}')).toEqual({
      directive: { name: 'theme-switcher', attrs: {} },
    })
  })

  it.each([
    ['text around it', 'See ::theme-switcher'],
    ['two lines', '::theme-switcher\nmore text'],
    ['a space after the colons', ':: theme-switcher'],
    ['an uppercase name', '::Theme'],
    ['unterminated braces', '::source{path="a"'],
    ['unquoted attributes', '::source{path=a}'],
  ])('rejects %s', (_, text) => {
    expect(parseDirective(text)).toHaveProperty('error')
  })
})

describe('directiveShapeError', () => {
  it('accepts every directive written with its required attributes', () => {
    expect(shape('::registry-api{slug="button"}')).toBeUndefined()
    expect(shape('::registry-api{slug="button" part="Button"}')).toBeUndefined()
    expect(shape('::registry-index{}')).toBeUndefined()
    expect(shape('::registry-index{kind="block" category="pages"}')).toBeUndefined()
    expect(shape('::registry-example{slug="form" example="basic"}')).toBeUndefined()
    expect(shape('::source{path="src/lib/cn.ts"}')).toBeUndefined()
    expect(shape('::design-tokens{group="color"}')).toBeUndefined()
    expect(shape('::theme-switcher')).toBeUndefined()
  })

  it('names the known directives when the name is wrong', () => {
    const message = shape('::registry-apis{slug="button"}')
    expect(message).toMatch(/unknown directive ::registry-apis/)
    for (const name of Object.keys(directiveSpecs)) expect(message).toContain(name)
  })

  it('requires the required attributes', () => {
    expect(shape('::registry-api')).toBe('::registry-api needs slug="…"')
    expect(shape('::registry-example{slug="form"}')).toBe('::registry-example needs example="…"')
  })

  it('rejects attributes the directive does not have', () => {
    expect(shape('::theme-switcher{mode="dark"}')).toBe('::theme-switcher has no attribute "mode"')
    expect(shape('::registry-api{slug="button" kind="block"}')).toMatch(/no attribute "kind"/)
  })

  it('rejects values outside a closed set', () => {
    expect(shape('::design-tokens{group="spacing"}')).toMatch(/is not one of color, radius/)
    expect(shape('::registry-index{kind="page"}')).toMatch(/is not one of component, block/)
  })
})
