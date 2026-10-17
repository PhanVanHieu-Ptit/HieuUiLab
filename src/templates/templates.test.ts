import { describe, expect, it } from 'vitest'

import { forbiddenInSource } from '@/test/source-rules'

/**
 * Rules that keep the example apps copyable and layout-safe. They read source text, because jsdom
 * has no layout, and cover every template and the shared shell.
 */
const sources = import.meta.glob<string>(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

// The loader file imports every template by design and is not part of any one of them.
const files = Object.entries(sources).filter(([path]) => !path.endsWith('template-modules.ts'))

/** What a template may import: UI, blocks, example data and chrome, and its own shell. */
const allowedImport =
  /^(?:react|lucide-react|@\/lib\/cn|@\/components\/(?:ui|blocks)\/[a-z-]+|@\/registry\/(?:[a-z-]+\/mock-data|demo-controls|mock-delay)|@\/templates\/shared\/[a-z-]+)$/

function specifiersOf(source: string): string[] {
  return [...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map((match) => match[1] ?? '')
}

describe('example app sources', () => {
  it('finds the templates and the shell', () => {
    const paths = files.map(([path]) => path)
    expect(paths).toContain('./admin-dashboard/template.tsx')
    expect(paths).toContain('./operations-monitoring/template.tsx')
    expect(paths).toContain('./data-management-workspace/template.tsx')
    expect(paths).toContain('./shared/template-shell.tsx')
  })

  describe.each(files)('%s', (_path, source) => {
    it.each(forbiddenInSource)('does not %s', (_description, pattern) => {
      expect(source).not.toMatch(pattern)
    })

    it('imports only what a copied template could resolve', () => {
      for (const specifier of specifiersOf(source)) {
        expect(specifier, specifier).toMatch(allowedImport)
      }
    })
  })

  it.each(files.filter(([path]) => path.endsWith('/template.tsx')))(
    '%s renders inside the shared shell',
    (_path, source) => {
      expect(source).toMatch(/<TemplateShell\b/)
      expect(source).toMatch(/<MockPicker\b/)
    },
  )
})
