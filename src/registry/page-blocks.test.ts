import { describe, expect, it } from 'vitest'

import { registry } from './index'
import { isImplemented, type ImplementedEntry } from './types'

/**
 * Rules that keep the page-level blocks usable inside the gallery's resizable preview and safe to
 * copy into a project. They are checked on source text, because jsdom has no layout.
 */
const pageBlocks = registry.filter(
  (entry): entry is ImplementedEntry => entry.category === 'pages' && isImplemented(entry),
)

const demoSources = import.meta.glob<string>('./*/demos.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const mockDataSources = import.meta.glob<string>('./*/mock-data.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** Blocks whose own layout follows their container, so a page that composes one is responsive. */
const containerAwareBlocks = new Set(['data-toolbar', 'profile-form'])

const demoOf = (slug: string) => demoSources[`./${slug}/demos.tsx`]
const mockDataOf = (slug: string) => mockDataSources[`./${slug}/mock-data.ts`]

/** Things a block must not do: follow the window, reach the outside world, or break theming. */
const forbidden: readonly [description: string, pattern: RegExp][] = [
  ['size itself from the viewport (min-h-screen / h-screen)', /\bmin-h-screen\b|\bh-screen\b/],
  ['use dynamic viewport units (dvh)', /\b\d*dvh\b|-\[\d+dvh\]/],
  ['position itself against the window (fixed)', /(?:^|[\s"'`])fixed(?=[\s"'`])/m],
  ['use dark: variants instead of tokens', /\bdark:/],
  ['read the window’s media queries (matchMedia)', /matchMedia/],
  ['read the clock during render (Date.now / new Date())', /Date\.now\(|new Date\(\)/],
  ['make network requests (fetch / XMLHttpRequest)', /\bfetch\(|XMLHttpRequest/],
  [
    'persist anything (localStorage / sessionStorage / cookies)',
    /localStorage|sessionStorage|document\.cookie/,
  ],
  ['depend on a router', /react-router/],
  [
    'use raw palette colors instead of semantic tokens',
    /\b(?:bg|text|border|ring|fill|stroke|outline|from|to|via)-(?:red|green|blue|yellow|orange|gray|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d+)?\b/,
  ],
]

describe('page-level blocks', () => {
  it('are the eight initial blocks, with stable slugs', () => {
    expect(pageBlocks.map((entry) => entry.slug).sort()).toEqual([
      'crud-management-page',
      'dashboard-overview',
      'monitoring-dashboard',
      'multi-step-onboarding',
      'notification-center',
      'search-filter-toolbar',
      'sign-in-page',
      'user-profile-settings',
    ])
  })

  it('are all blocks, listed under /blocks', () => {
    for (const entry of pageBlocks) expect(entry.kind, entry.slug).toBe('block')
  })

  describe.each(pageBlocks.map((entry) => [entry.slug, entry] as const))('%s', (slug, entry) => {
    it('reflows with the width of its container', () => {
      expect(entry.source).toContain('@container')
      // Either the block lays itself out with container-query variants, or it gets its responsive
      // layout from a block it composes that does (Data toolbar and Profile form do).
      const ownVariants = /@(?:xs|sm|md|lg|xl|2xl|3xl|4xl|\[\d+rem\]):/.test(entry.source)
      const composesResponsive = entry.installation.registryDependencies.some((dependency) =>
        containerAwareBlocks.has(dependency),
      )
      expect(ownVariants || composesResponsive).toBe(true)
    })

    it.each(forbidden)('does not %s', (_description, pattern) => {
      expect(entry.source).not.toMatch(pattern)
    })

    it('has demos that follow the same rules', () => {
      const source = demoOf(slug)
      expect(source).toBeDefined()
      expect(source).not.toMatch(/react-router|Date\.now\(|new Date\(\)|\bfetch\(|localStorage/)
    })

    it('shows every example in the resizable preview, filling its frame', () => {
      expect(entry.examples.length).toBeGreaterThanOrEqual(2)
      for (const example of entry.examples) {
        expect(example.preview, example.id).toMatchObject({ layout: 'fill', responsive: true })
      }
    })

    it('says in every example description that the data is invented or example only', () => {
      for (const example of entry.examples) {
        expect(example.description ?? '', example.id).toMatch(/example|invented|mock/i)
      }
    })

    it('keeps its mock data in a file that says so', () => {
      const source = mockDataOf(slug)
      // Blocks that need no data of their own may skip the file; the rest must label it.
      if (source !== undefined) expect(source).toMatch(/invented|example/i)
    })

    it('documents its main component and every prop', () => {
      const [main] = entry.api.parts
      expect(main.props.length).toBeGreaterThan(0)
      for (const prop of main.props) {
        expect(prop.description.trim(), `${prop.name} description`).not.toBe('')
        expect(prop.type.trim(), `${prop.name} type`).not.toBe('')
      }
    })

    it('explains itself and how to adapt it', () => {
      expect(entry.guidelines?.length ?? 0).toBeGreaterThanOrEqual(4)
      expect(entry.installation.notes?.length ?? 0).toBeGreaterThanOrEqual(1)
    })

    it('declares what it needs: tokens and the cn helper', () => {
      expect(entry.installation.requirements).toEqual(
        expect.arrayContaining(['cn-helper', 'design-tokens']),
      )
    })
  })
})
