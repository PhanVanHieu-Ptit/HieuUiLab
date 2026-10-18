import { describe, expect, it } from 'vitest'

import {
  DOCS_BASE,
  docFile,
  docHref,
  docNeighbours,
  docNodes,
  docRedirects,
  findDocByHref,
  findDocById,
} from './manifest'
import { suggestDocs } from './suggest'

function page(id: string) {
  const found = findDocById(id)
  if (!found) throw new Error(`No docs page "${id}"`)
  return found
}

describe('docHref', () => {
  it('puts a slug under its parent and leaves an index at the parent', () => {
    expect(docHref('/docs', 'installation')).toBe('/docs/installation')
    expect(docHref('/docs/guides', 'forms')).toBe('/docs/guides/forms')
    expect(docHref('/docs', '')).toBe('/docs')
  })
})

describe('the docs manifest', () => {
  it('has pages, the first of which is the docs index', () => {
    expect(docNodes.length).toBeGreaterThan(0)
    expect(docNodes[0]?.href).toBe(DOCS_BASE)
  })

  it('numbers every page once, by id and by URL', () => {
    expect(new Set(docNodes.map((node) => node.entry.id)).size).toBe(docNodes.length)
    expect(new Set(docNodes.map((node) => node.href)).size).toBe(docNodes.length)
  })

  it('nests children under their parent, with the parents listed outermost first', () => {
    const child = findDocByHref('/docs/block-composition/templates')
    expect(child?.parents.map((parent) => parent.href)).toEqual(['/docs/block-composition'])
    expect(child?.group.id).toBe(findDocByHref('/docs/block-composition')?.group.id)
    expect(findDocByHref('/docs/installation')?.parents).toEqual([])
  })

  it('lists a page, then its children, in reading order', () => {
    const hrefs = docNodes.map((node) => node.href)
    const parent = hrefs.indexOf('/docs/block-composition')
    expect(hrefs.slice(parent, parent + 3)).toEqual([
      '/docs/block-composition',
      '/docs/block-composition/page-blocks',
      '/docs/block-composition/templates',
    ])
  })

  it('finds a page by id and by URL', () => {
    expect(findDocById('installation')?.href).toBe('/docs/installation')
    expect(findDocByHref('/docs/installation')?.entry.id).toBe('installation')
    expect(findDocById('nope')).toBeUndefined()
    expect(findDocByHref('/docs/nope')).toBeUndefined()
  })

  it('points each page at its Markdown file', () => {
    expect(docFile(page('installation').entry)).toBe('src/docs/content/installation.md')
    expect(docFile(page('changelog').entry)).toBe('CHANGELOG.md')
  })

  it('redirects only to pages that exist', () => {
    for (const [from, to] of Object.entries(docRedirects)) {
      expect(findDocByHref(from), from).toBeUndefined()
      expect(findDocByHref(to), to).toBeDefined()
    }
  })

  it('has no previous page for the first and no next page for the last', () => {
    const first = docNodes.at(0)
    const last = docNodes.at(-1)
    if (!first || !last) throw new Error('The manifest has no pages')
    expect(docNeighbours(first).previous).toBeUndefined()
    expect(docNeighbours(first).next).toBe(docNodes[1])
    expect(docNeighbours(last).next).toBeUndefined()
    expect(docNeighbours(last).previous).toBe(docNodes.at(-2))
  })

  it('walks the whole list with previous and next', () => {
    const visited = [docNodes[0]]
    for (let node = docNodes[0]; node;) {
      node = docNeighbours(node).next
      if (node) visited.push(node)
    }
    expect(visited).toEqual(docNodes)
  })
})

describe('suggestDocs', () => {
  it('finds a page from a mistyped slug', () => {
    expect(suggestDocs('instalation')[0]).toEqual({
      title: 'Installation',
      href: '/docs/installation',
    })
    expect(suggestDocs('/testin')[0]?.href).toBe('/docs/testing')
  })

  it('finds a page that shares a word with the path', () => {
    expect(suggestDocs('colors').map((suggestion) => suggestion.href)).toContain(
      '/docs/design-tokens',
    )
  })

  it('uses the last segment for a nested path', () => {
    expect(suggestDocs('block-composition/templat')[0]?.href).toBe(
      '/docs/block-composition/templates',
    )
  })

  it('suggests nothing for a path unlike any page, and never the index', () => {
    expect(suggestDocs('zzzzzzzz')).toEqual([])
    expect(suggestDocs('getting-started').map((suggestion) => suggestion.href)).not.toContain(
      '/docs',
    )
  })

  it('suggests at most three pages', () => {
    expect(suggestDocs('page').length).toBeLessThanOrEqual(3)
  })
})
