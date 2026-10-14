import { describe, expect, it } from 'vitest'

import { registry } from '.'
import type { ImplementedEntry, PlannedEntry, RegistryEntry } from './types'
import { assertValidRegistry, parseSourceImports, validateRegistry } from './validate'

function Example() {
  return null
}

function implemented(slug: string, overrides: Partial<ImplementedEntry> = {}): ImplementedEntry {
  return {
    id: slug,
    slug,
    name: slug,
    description: `The ${slug} entry.`,
    kind: 'component',
    category: 'actions',
    tags: ['a11y'],
    status: 'stable',
    installation: {
      targetPath: `components/ui/${slug}.tsx`,
      packages: [],
      registryDependencies: [],
      requirements: ['cn-helper'],
    },
    source: `import { cn } from '@/lib/cn'\nexport function X() { return null }`,
    examples: [{ id: 'basic', title: 'Basic', component: Example, code: '<X />' }],
    api: {
      parts: [{ name: 'X', props: [{ name: 'size', type: 'string', description: 'Size.' }] }],
    },
    ...overrides,
  }
}

function planned(slug: string, overrides: Partial<PlannedEntry> = {}): PlannedEntry {
  return {
    id: slug,
    slug,
    name: slug,
    description: `The ${slug} entry.`,
    kind: 'component',
    category: 'inputs',
    tags: [],
    status: 'planned',
    plannedScope: 'What it will do.',
    ...overrides,
  }
}

/** A block at `slug` that imports each of `dependencies` from components/ui. */
function block(slug: string, dependencies: string[]): ImplementedEntry {
  return implemented(slug, {
    kind: 'block',
    installation: {
      targetPath: `components/blocks/${slug}.tsx`,
      packages: [],
      registryDependencies: dependencies,
      requirements: [],
    },
    source: dependencies.map((dep) => `import { X } from '@/components/ui/${dep}'`).join('\n'),
  })
}

function messages(entries: readonly RegistryEntry[]): string[] {
  return validateRegistry(entries).map((issue) => `${issue.entry} ${issue.field}: ${issue.message}`)
}

describe('validateRegistry', () => {
  it('accepts the real registry', () => {
    expect(validateRegistry(registry)).toEqual([])
    expect(() => {
      assertValidRegistry(registry)
    }).not.toThrow()
  })

  it('accepts valid fixtures', () => {
    expect(messages([implemented('a'), planned('b')])).toEqual([])
  })

  it('detects duplicate ids and slugs', () => {
    const issues = messages([
      implemented('a'),
      implemented('b', { id: 'a' }),
      implemented('c', { id: 'c2', slug: 'a' }),
    ])
    expect(issues).toContain('a id: id "a" is used by more than one entry')
    expect(issues).toContain('a slug: slug "a" is used by more than one entry')
  })

  it('detects slugs and ids that are not kebab-case', () => {
    const issues = messages([implemented('Bad Slug', { id: 'bad_id' })])
    expect(issues).toContain('bad_id id: "bad_id" is not kebab-case')
    expect(issues).toContain('bad_id slug: "Bad Slug" is not kebab-case')
  })

  it('detects empty text, unknown taxonomy, and repeated tags', () => {
    const entry = implemented('a', {
      name: ' ',
      category: 'widgets' as never,
      tags: ['a11y', 'a11y', 'shiny' as never],
    })
    const issues = messages([entry])
    expect(issues).toContain('a name: is empty')
    expect(issues).toContain('a category: unknown category "widgets"')
    expect(issues).toContain('a tags: unknown tag "shiny"')
    expect(issues).toContain('a tags: lists "a11y" more than once')
  })

  it('detects registry dependencies that are missing, planned, or the entry itself', () => {
    const issues = messages([
      planned('soon'),
      implemented('a', {
        installation: {
          targetPath: 'components/ui/a.tsx',
          packages: [],
          registryDependencies: ['missing', 'soon', 'a'],
          requirements: ['cn-helper'],
        },
      }),
    ])
    expect(issues).toContain(
      'a installation.registryDependencies: "missing" is not in the registry',
    )
    expect(issues).toContain(
      'a installation.registryDependencies: "soon" is planned, not implemented',
    )
    expect(issues).toContain('a installation.registryDependencies: depends on itself')
  })

  it('detects dependency cycles', () => {
    const a = block('a', ['b'])
    const b = block('b', ['a'])
    // Point each dependency at the other's actual file so only the cycle is reported.
    const issues = messages([
      { ...a, source: "import { B } from '@/components/blocks/b'" },
      { ...b, source: "import { A } from '@/components/blocks/a'" },
    ])
    expect(issues.some((issue) => issue.includes('dependency cycle a → b → a'))).toBe(true)
  })

  it('detects install steps that drift from the source', () => {
    const entry = implemented('a', {
      installation: {
        targetPath: 'components/ui/a.tsx',
        packages: ['radix-ui'],
        registryDependencies: [],
        requirements: [],
      },
      source: [
        "import { X } from 'lucide-react'",
        "import { cn } from '@/lib/cn'",
        "import { helper } from '@/lib/helper'",
        "import { Button } from '@/components/ui/button'",
        'const c = "focus-ring"',
      ].join('\n'),
    })
    const issues = messages([entry])
    expect(issues).toContain(
      'a installation.packages: source imports "lucide-react" but it is not declared',
    )
    expect(issues).toContain(
      'a installation.packages: declares "radix-ui" but the source does not import it',
    )
    expect(issues).toContain(
      'a source: imports "@/lib/helper", which a consuming project would not have',
    )
    expect(issues).toContain(
      'a installation.registryDependencies: source imports components/ui/button.tsx but no dependency provides it',
    )
    expect(issues).toContain(
      'a installation.requirements: source uses cn but cn-helper is not required',
    )
    expect(issues).toContain(
      'a installation.requirements: source uses a state utility but state-utilities is not required',
    )
  })

  it('detects unknown packages, bad target paths, and empty source', () => {
    const entry = implemented('a', {
      source: '',
      installation: {
        targetPath: 'src/a.ts',
        packages: ['left-pad' as never],
        registryDependencies: [],
        requirements: ['magic' as never],
      },
    })
    const issues = messages([entry])
    expect(issues).toContain('a source: is empty')
    expect(issues).toContain(
      'a installation.targetPath: "src/a.ts" is not components/(ui|blocks)/<name>.tsx',
    )
    expect(issues).toContain('a installation.packages: unknown package "left-pad"')
    expect(issues).toContain('a installation.requirements: unknown requirement "magic"')
  })

  it('detects duplicate example ids and API documentation', () => {
    const entry = implemented('a', {
      examples: [
        { id: 'basic', title: 'One', component: Example, code: 'x' },
        { id: 'basic', title: 'Two', component: Example, code: '' },
      ],
      api: {
        parts: [
          {
            name: 'X',
            props: [
              { name: 'size', type: 'string', description: 'Size.' },
              { name: 'size', type: 'string', description: 'Again.' },
              {
                name: 'open',
                type: 'boolean',
                required: true,
                default: 'false',
                description: 'Open.',
              },
            ],
          },
          { name: 'X', props: [] },
        ],
      },
    })
    const issues = messages([entry])
    expect(issues).toContain('a examples: example id "basic" is used more than once')
    expect(issues).toContain('a examples.basic: has no code')
    expect(issues).toContain('a api: part "X" is documented more than once')
    expect(issues).toContain('a api.X: prop "size" is documented more than once')
    expect(issues).toContain('a api.X: prop "open" is required but has a default')
  })

  it('rejects a planned entry that carries implementation fields', () => {
    const disguised = { ...planned('a'), source: 'export {}' } as RegistryEntry
    expect(messages([disguised])).toContain(
      'a source: a planned entry must not have implementation fields',
    )
  })

  it('rejects an implemented entry missing implementation fields', () => {
    const withoutExamples: Partial<ImplementedEntry> = implemented('a')
    delete withoutExamples.examples
    expect(messages([withoutExamples as RegistryEntry])).toContain('a examples: is missing')
  })

  it('lists every issue when asserting', () => {
    expect(() => {
      assertValidRegistry([implemented('a'), implemented('a')])
    }).toThrow(/Invalid registry metadata:\n- a › id: .*\n- a › slug: /)
  })
})

describe('parseSourceImports', () => {
  it('groups imports by what they mean for installation', () => {
    const imports = parseSourceImports(`
import type { ReactNode } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { Thing } from '@scope/pkg/sub'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/blocks/empty-state'
import { cn } from '@/lib/cn'
import './styles.css'
`)
    expect([...imports.packages]).toEqual(['radix-ui', '@scope/pkg'])
    expect([...imports.registryFiles]).toEqual([
      'components/ui/dialog.tsx',
      'components/blocks/empty-state.tsx',
    ])
    expect(imports.usesCn).toBe(true)
    expect(imports.unresolvable).toEqual(['./styles.css'])
  })
})
