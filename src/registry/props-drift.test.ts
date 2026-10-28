import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { fullRegistry } from '@/test/full-registry'

import { isImplemented } from './types'

/**
 * The props tables are written by hand in each entry's `meta.ts`, and `validate.ts` checks the
 * export names, not the props. This test reads the entry's source and compares: a prop that a
 * `<Part>Props` interface declares itself (not one it inherits from a native element) must be in
 * that part's table. It cannot see a prop documented but removed from the source, a part that has
 * no `<Part>Props` interface, or a type that changed; those stay a matter for review.
 */
/**
 * Interfaces called `<Part>Props` that do not describe the part's props. `FieldControlProps` is the
 * shape `useFieldControlProps()` returns, which `FieldControl` merges onto its child.
 */
const notThePartsProps = new Set(['field › FieldControl'])

/** A table row may name several props at once, such as `sort / defaultSort / onSortChange`. */
function documentedNames(names: readonly string[]): Set<string> {
  return new Set(names.flatMap((name) => name.split('/').map((each) => each.trim())))
}

function ownProps(source: string, interfaceName: string): string[] | undefined {
  const file = ts.createSourceFile(
    'entry.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  let found: string[] | undefined
  file.forEachChild((node) => {
    if (!ts.isInterfaceDeclaration(node) || node.name.text !== interfaceName) return
    found = node.members.flatMap((member) =>
      ts.isPropertySignature(member) &&
      (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))
        ? [member.name.text]
        : [],
    )
  })
  return found
}

describe('the props tables of the registry', () => {
  const entries = fullRegistry.filter(isImplemented)

  it('finds the interfaces it is meant to compare', () => {
    const compared = entries.flatMap((entry) =>
      entry.api.parts.filter((part) => ownProps(entry.source, `${part.name}Props`) !== undefined),
    )
    // If this drops to nothing the test below checks nothing.
    expect(compared.length).toBeGreaterThan(20)
  })

  it.each(entries.map((entry) => [entry.slug, entry] as const))(
    '%s documents every prop its Props interfaces declare',
    (_slug, entry) => {
      for (const part of entry.api.parts) {
        const declared = ownProps(entry.source, `${part.name}Props`)
        if (declared === undefined || notThePartsProps.has(`${entry.slug} › ${part.name}`)) continue
        const documented = documentedNames(part.props.map((prop) => prop.name))
        const missing = declared.filter((name) => !documented.has(name))
        expect(missing, `${entry.slug} › ${part.name} declares props its table lacks`).toEqual([])
      }
    },
  )
})
