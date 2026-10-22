import { describe, expect, it } from 'vitest'

import { shadcnRegistryContext } from '@/test/registry-context'

import { shadcnBuiltinUi } from './config'
import {
  buildShadcnRegistry,
  rewriteSource,
  toIndexItem,
  tokensUsed,
  usesBareBorder,
  type ShadcnItem,
} from './manifest'
import {
  formatShadcnIssues,
  validateShadcnRegistry,
  type ShadcnIssue,
  type ShadcnRegistryContext,
} from './rules'

const real = shadcnRegistryContext()

/** A copy of the real context that the test may change freely; the index follows the items. */
function copy(change: (ctx: ShadcnRegistryContext & { items: ShadcnItem[] }) => void) {
  const ctx = {
    ...real,
    items: structuredClone(real.items) as ShadcnItem[],
    index: structuredClone(real.index),
    publicFiles: [...real.publicFiles],
  }
  change(ctx)
  ctx.index.items = ctx.items.map(toIndexItem)
  return validateShadcnRegistry(ctx)
}

function expectIssue(issues: readonly ShadcnIssue[], item: string, field: string, text: string) {
  const found = issues.some(
    (issue) => issue.item === item && issue.field === field && issue.message.includes(text),
  )
  expect(
    found,
    `expected "${item} › ${field}: …${text}…" among:\n${formatShadcnIssues(issues)}`,
  ).toBe(true)
}

const kbd = (ctx: { items: ShadcnItem[] }) => {
  const item = ctx.items[0]
  if (!item) throw new Error('the registry publishes no items')
  return item
}

const kbdFile = (ctx: { items: ShadcnItem[] }) => {
  const file = kbd(ctx).files[0]
  if (!file) throw new Error('the first item has no file')
  return file
}

describe('validateShadcnRegistry', () => {
  it('accepts the real registry', () => {
    expect(copy(() => undefined)).toEqual([])
  })

  describe('names', () => {
    it('rejects a name that is not kebab-case', () => {
      expectIssue(
        copy((ctx) => (kbd(ctx).name = 'Kbd_One')),
        'Kbd_One',
        'name',
        'not kebab-case',
      )
    })

    it('rejects the name reserved for the catalog', () => {
      expectIssue(
        copy((ctx) => (kbd(ctx).name = 'registry')),
        'registry',
        'name',
        'reserved',
      )
    })

    it('rejects two items with the same name', () => {
      const issues = copy((ctx) => ctx.items.push(structuredClone(kbd(ctx))))
      expectIssue(issues, 'kbd', 'name', 'more than one item')
    })

    it('rejects a shadcn name that was not acknowledged', () => {
      const issues = validateShadcnRegistry({ ...real, shadowsBuiltin: [] })
      expectIssue(issues, 'kbd', 'name', 'also the name of a shadcn item')
    })

    it('rejects an acknowledgement for a name shadcn does not use', () => {
      const issues = validateShadcnRegistry({ ...real, shadowsBuiltin: ['kbd', 'not-in-shadcn'] })
      expectIssue(issues, 'not-in-shadcn', 'shadowsBuiltin', 'shadcn has no item')
    })

    it('knows the built-in names it was verified against', () => {
      expect(shadcnBuiltinUi.size).toBe(65)
      expect(shadcnBuiltinUi.has('kbd')).toBe(true)
    })
  })

  describe('published entries', () => {
    const publish = (slug: string) => {
      const { items, index } = buildShadcnRegistry(real.entries, [slug], 'https://example.com/x')
      return validateShadcnRegistry({
        ...real,
        publishedSlugs: [slug],
        shadowsBuiltin: [slug],
        items,
        index,
        publicFiles: ['/r/registry.json', `/r/${slug}.json`],
      })
    }

    it('refuses an entry that needs the state utilities', () => {
      const issues = publish('input')
      expectIssue(issues, 'input', 'installation.requirements', 'not supported yet')
      expectIssue(issues, 'input', 'files[0].content', 'focus-ring')
    })

    it('refuses an entry that uses tokens only this site defines', () => {
      expectIssue(publish('badge'), 'badge', 'files[0].content', 'tokens only this site defines')
    })

    it('refuses a block', () => {
      expect(() =>
        buildShadcnRegistry(real.entries, ['dashboard-overview'], 'https://x.dev'),
      ).toThrow('only components')
    })

    it('refuses a planned entry', () => {
      expect(() => buildShadcnRegistry(real.entries, ['combobox'], 'https://x.dev')).toThrow(
        'not an implemented entry',
      )
    })

    it('reports a slug that is not in the registry', () => {
      const issues = validateShadcnRegistry({ ...real, publishedSlugs: ['kbd', 'nope'] })
      expectIssue(issues, 'nope', 'publishedSlugs', 'not in the registry')
    })

    it('reports a published slug without an item, and an item that is not published', () => {
      expectIssue(
        validateShadcnRegistry({ ...real, publishedSlugs: ['kbd', 'skeleton'] }),
        'skeleton',
        'items',
        'no item',
      )
      expectIssue(
        validateShadcnRegistry({ ...real, publishedSlugs: [] }),
        'kbd',
        'name',
        'not in the published list',
      )
    })
  })

  describe('files', () => {
    it('reports a source file that does not exist', () => {
      const issues = validateShadcnRegistry({ ...real, readFile: () => undefined })
      expectIssue(issues, 'kbd', 'files', 'src/components/ui/kbd.tsx does not exist')
    })

    it('reports content that differs from the source', () => {
      const issues = copy((ctx) => (kbdFile(ctx).content += '// edited\n'))
      expectIssue(issues, 'kbd', 'files[0].content', 'differs from src/components/ui/kbd.tsx')
    })

    it('reports empty content', () => {
      expectIssue(
        copy((ctx) => (kbdFile(ctx).content = ' ')),
        'kbd',
        'files[0].content',
        'empty',
      )
    })

    it('reports an import of the site helper that was not rewritten', () => {
      const issues = copy((ctx) => {
        kbdFile(ctx).content = "import { cn } from '@/lib/cn'\n"
      })
      expectIssue(issues, 'kbd', 'files[0].content', 'still imports @/lib/cn')
    })

    it('reports an import a consuming project cannot resolve', () => {
      const issues = copy((ctx) => {
        kbdFile(ctx).content += "import { x } from '@/lib/other'\n"
      })
      expectIssue(issues, 'kbd', 'files[0].content', 'cannot resolve')
    })

    it('reports a wrong file path and a type that differs from the item', () => {
      const issues = copy((ctx) => {
        kbdFile(ctx).path = 'src/kbd.tsx'
        kbdFile(ctx).type = 'registry:ui'
        kbd(ctx).type = 'registry:ui'
      })
      expectIssue(issues, 'kbd', 'files[0].path', 'expected "registry/ui/kbd.tsx"')
    })

    it('reports an empty file list', () => {
      expectIssue(
        copy((ctx) => (kbd(ctx).files = [])),
        'kbd',
        'files',
        'empty',
      )
    })

    it('reports a field the registry does not emit, such as author', () => {
      const issues = copy((ctx) => Object.assign(kbd(ctx), { author: 'someone' }))
      expectIssue(issues, 'kbd', 'author', 'not a field this registry emits')
      const file = copy((ctx) => Object.assign(kbdFile(ctx), { target: 'x' }))
      expectIssue(file, 'kbd', 'files[0].target', 'not a field this registry emits')
    })

    it('reports an unsupported item type', () => {
      const issues = copy((ctx) => {
        Object.assign(kbd(ctx), { type: 'registry:block' })
        Object.assign(kbdFile(ctx), { type: 'registry:block' })
      })
      expectIssue(issues, 'kbd', 'type', 'not supported yet')
    })

    it('reports two items that write the same file path', () => {
      const issues = copy((ctx) => {
        const second = structuredClone(kbd(ctx))
        second.name = 'second'
        ctx.items.push(second)
      })
      expectIssue(issues, 'index', 'files', 'same file path')
    })
  })

  describe('dependencies', () => {
    it('reports an import that is not declared', () => {
      expectIssue(
        copy((ctx) => (kbd(ctx).dependencies = [])),
        'kbd',
        'dependencies',
        'not declared',
      )
    })

    it('reports a declared package the source does not import', () => {
      const issues = copy((ctx) => kbd(ctx).dependencies.push('clsx'))
      expectIssue(issues, 'kbd', 'dependencies', 'does not import it')
    })

    it("reports a package that is neither this site's nor one the emit step adds", () => {
      const issues = copy((ctx) => {
        kbdFile(ctx).content += "import left from 'left-pad'\n"
        kbd(ctx).dependencies.push('left-pad')
      })
      expectIssue(issues, 'kbd', 'dependencies', 'not a dependency of this site')
    })

    it('reports a pinned version, a duplicate and a malformed name', () => {
      const issues = copy((ctx) => kbd(ctx).dependencies.push('cn@0.5.0', 'cn', 'Bad Name'))
      expectIssue(issues, 'kbd', 'dependencies', 'not a bare package name')
      expectIssue(issues, 'kbd', 'dependencies', 'more than once')
    })
  })

  describe('registry dependencies', () => {
    const withDependencies = (...names: string[]) =>
      copy((ctx) => (kbd(ctx).registryDependencies = names))

    it('rejects a bare name, which shadcn resolves to its own registry', () => {
      expectIssue(withDependencies('button'), 'kbd', 'registryDependencies', 'bare name')
    })

    it('rejects an item of this registry that is not published', () => {
      expectIssue(
        withDependencies('@hieuuilab/button'),
        'kbd',
        'registryDependencies',
        'not a published',
      )
    })

    it('rejects a dependency on itself and a duplicate', () => {
      expectIssue(withDependencies('@hieuuilab/kbd'), 'kbd', 'registryDependencies', 'itself')
      expectIssue(
        withDependencies('https://x.dev/r/a.json', 'https://x.dev/r/a.json'),
        'kbd',
        'registryDependencies',
        'more than once',
      )
    })

    it('accepts a full URL', () => {
      expect(withDependencies('https://example.com/r/other.json')).toEqual([])
    })

    it('reports a dependency cycle', () => {
      const issues = copy((ctx) => {
        const second = structuredClone(kbd(ctx))
        second.name = 'second'
        second.files = second.files.map((file) => ({ ...file, path: 'registry/ui/second.tsx' }))
        second.registryDependencies = ['@hieuuilab/kbd']
        kbd(ctx).registryDependencies = ['@hieuuilab/second']
        ctx.items.push(second)
      })
      expect(issues.some((issue) => issue.message.includes('dependency cycle'))).toBe(true)
    })

    it('requires the dependency when the source imports another registry component', () => {
      const issues = copy((ctx) => {
        kbdFile(ctx).content += "import { Button } from '@/components/ui/button'\n"
      })
      expectIssue(issues, 'kbd', 'registryDependencies', 'does not depend on @hieuuilab/button')
    })
  })

  describe('index', () => {
    it('reports a catalog that differs from the item files', () => {
      const index = structuredClone(real.index)
      index.items = index.items.map((item) => ({ ...item, description: 'changed' }))
      expectIssue(
        validateShadcnRegistry({ ...real, index }),
        'index',
        'items',
        'does not match the item files',
      )
    })

    it('reports a wrong name and a homepage that is not https', () => {
      const ctx = {
        ...real,
        index: { ...structuredClone(real.index), name: 'x', homepage: 'http://x' },
      }
      const issues = validateShadcnRegistry(ctx)
      expectIssue(issues, 'index', 'name', 'expected "hieu-ui-lab"')
      expectIssue(issues, 'index', 'homepage', 'https')
    })

    it('reports a field the registry does not emit', () => {
      const ctx = { ...real, index: Object.assign(structuredClone(real.index), { author: 'x' }) }
      expectIssue(validateShadcnRegistry(ctx), 'index', 'author', 'not a field')
    })

    it('reports a missing file and an orphan under public/r', () => {
      const missing = validateShadcnRegistry({ ...real, publicFiles: ['/r/registry.json'] })
      expectIssue(missing, 'index', 'files', 'public/r/kbd.json is missing')
      const orphan = validateShadcnRegistry({
        ...real,
        publicFiles: [...real.publicFiles, '/r/old.json'],
      })
      expectIssue(orphan, 'index', 'files', 'public/r/old.json belongs to no published item')
    })
  })
})

describe('manifest helpers', () => {
  it('rewrites only the site helper import', () => {
    const source = "import { cn } from '@/lib/cn'\nimport { x } from 'clsx'\n"
    expect(rewriteSource(source)).toBe("import { cn } from 'cn'\nimport { x } from 'clsx'\n")
  })

  it('matches a color token whole, not as a prefix of a longer one', () => {
    const used = tokensUsed('bg-muted text-muted-foreground hover:bg-accent/50', [
      'muted',
      'muted-foreground',
      'accent',
      'primary',
    ])
    expect(used).toEqual(['accent', 'muted', 'muted-foreground'])
    expect(tokensUsed('text-muted-foreground', ['muted'])).toEqual([])
  })

  it('recognises a bare border utility, not border-border or border-2', () => {
    expect(usesBareBorder('rounded border px-1')).toBe(true)
    expect(usesBareBorder('hover:border')).toBe(true)
    expect(usesBareBorder('border-border border-2')).toBe(false)
  })
})
