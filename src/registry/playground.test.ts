import { describe, expect, it } from 'vitest'

import { Button } from '@/components/ui/button'

import { getLoadedEntry, fullRegistry } from '@/test/full-registry'

import {
  defaultPlaygroundValues,
  definePlayground,
  playgroundJsx,
  resolvePlaygroundProps,
} from './playground'
import { isImplemented, type LoadedEntry } from './types'
import { importStatement, partExportNames, playgroundCode, sourceExports } from './usage'

function entry(slug: string): LoadedEntry {
  const found = getLoadedEntry(slug)
  if (!found) throw new Error(`No implemented entry "${slug}"`)
  return found
}

describe('resolvePlaygroundProps', () => {
  const button = entry('button')
  const playground = button.playground
  if (!playground) throw new Error('Button has no playground')

  it('leaves out defaults, false flags, and empty text', () => {
    expect(resolvePlaygroundProps(playground, defaultPlaygroundValues(playground))).toEqual([
      ['children', 'Save changes'],
    ])
    expect(
      resolvePlaygroundProps(playground, {
        children: '',
        variant: 'outline',
        size: 'md',
        loading: true,
        disabled: false,
      }),
    ).toEqual([
      ['variant', 'outline'],
      ['loading', true],
    ])
  })

  it('adds static props after the controls', () => {
    const input = entry('input').playground
    if (!input) throw new Error('Input has no playground')
    expect(resolvePlaygroundProps(input, defaultPlaygroundValues(input))).toEqual([
      ['placeholder', 'you@example.com'],
      ['aria-label', 'Email'],
    ])
  })
})

describe('playgroundJsx', () => {
  it('writes flags as bare attributes and text as children', () => {
    expect(
      playgroundJsx('Button', [
        ['variant', 'outline'],
        ['loading', true],
        ['children', 'Save'],
      ]),
    ).toBe('<Button variant="outline" loading>Save</Button>')
  })

  it('self-closes without children', () => {
    expect(playgroundJsx('Spinner', [['label', 'Loading']])).toBe('<Spinner label="Loading" />')
  })

  it('escapes text that JSX would misread', () => {
    expect(
      playgroundJsx('Button', [
        ['aria-label', 'Say "hi"'],
        ['children', '{x} < y'],
      ]),
    ).toBe('<Button aria-label={"Say \\"hi\\""}>{"{x} < y"}</Button>')
  })

  it('breaks long elements onto one attribute per line', () => {
    const jsx = playgroundJsx('Button', [
      ['variant', 'destructive'],
      ['size', 'lg'],
      ['loading', true],
      ['children', 'Delete every archived workspace permanently'],
    ])
    expect(jsx).toBe(
      [
        '<Button',
        '  variant="destructive"',
        '  size="lg"',
        '  loading',
        '>',
        '  Delete every archived workspace permanently',
        '</Button>',
      ].join('\n'),
    )
  })
})

describe('playgroundCode', () => {
  it('is a self-contained example importing the real module', () => {
    expect(playgroundCode(entry('button'), { variant: 'ghost', children: 'Cancel' })).toBe(
      [
        "import { Button } from '@/components/ui/button'",
        '',
        'export function ButtonExample() {',
        '  return <Button variant="ghost">Cancel</Button>',
        '}',
        '',
      ].join('\n'),
    )
  })

  it('is empty for an entry without a playground', () => {
    expect(playgroundCode(entry('dialog'))).toBe('')
  })
})

describe('importStatement', () => {
  it('imports every documented export from the target path', () => {
    expect(importStatement(entry('tabs'))).toBe(
      "import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'",
    )
  })

  it('splits grouped parts, marks types, and wraps long lines', () => {
    const statement = importStatement(entry('data-table'))
    expect(statement).toContain('  type DataTableColumn,\n')
    expect(statement).toContain('  sortRows,\n  paginateRows,\n')
    expect(statement.endsWith("} from '@/components/blocks/data-table'")).toBe(true)
  })

  it('names only exports the source really has, for every entry', () => {
    for (const each of fullRegistry.filter(isImplemented)) {
      const exported = sourceExports(each.source)
      const names = each.api.parts.flatMap(partExportNames)
      expect(
        names.filter((name) => !exported.has(name)),
        each.slug,
      ).toEqual([])
    }
  })
})

describe('sourceExports', () => {
  it('reads declarations and export lists', () => {
    const exports = sourceExports(
      [
        'export function A() {}',
        'export const B = 1',
        'export interface C {}',
        'export type D = string',
        'export { E, type F, G as H }',
      ].join('\n'),
    )
    expect(Object.fromEntries(exports)).toEqual({
      A: 'value',
      B: 'value',
      C: 'type',
      D: 'type',
      E: 'value',
      F: 'type',
      H: 'value',
    })
  })
})

describe('definePlayground', () => {
  it('rejects props and options the component does not have at compile time', () => {
    definePlayground(Button, {
      part: 'Button',
      // @ts-expect-error -- Button has no `tone` prop.
      controls: [{ kind: 'select', prop: 'tone', options: ['info'], default: 'info' }],
    })
    definePlayground(Button, {
      part: 'Button',
      // @ts-expect-error -- `huge` is not a Button size.
      controls: [{ kind: 'select', prop: 'size', options: ['huge'], default: 'huge' }],
    })
    expect(true).toBe(true)
  })
})
