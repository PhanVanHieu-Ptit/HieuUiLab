import { describe, expect, it } from 'vitest'

import { builtShadcnRegistry } from '@/test/registry-context'

import {
  cliSchemaIssuesForIndex,
  cliSchemaIssuesForItem,
  jsonSchemaIssuesForIndex,
  jsonSchemaIssuesForItem,
} from './schemas'

/*
 * What the two schema validators say about a malformed manifest. build.test.ts checks that the real
 * files pass; these check that bad ones do not, and write down what neither validator can see (the
 * cases `rules.ts` exists for, tested in rules.test.ts). The shapes come from the real kbd item and
 * index, changed one thing at a time.
 */

type Json = Record<string, unknown>

const built = builtShadcnRegistry()

function realItem(): Json {
  return structuredClone(built.items[0]) as unknown as Json
}

function realIndex(): Json {
  return structuredClone(built.index) as unknown as Json
}

function firstFile(item: Json): Json {
  const file = (item.files as Json[] | undefined)?.[0]
  if (!file) throw new Error('the real item has no file')
  return file
}

/** Both validators must report something, and both must name `token`. */
function expectBothReject(issues: { json: string[]; cli: string[] }, token: string, label: string) {
  expect(issues.json.length, `JSON Schema accepted ${label}`).toBeGreaterThan(0)
  expect(issues.cli.length, `CLI schema accepted ${label}`).toBeGreaterThan(0)
  expect(issues.json.join('\n'), `JSON Schema did not name ${token}`).toContain(token)
  expect(issues.cli.join('\n'), `CLI schema did not name ${token}`).toContain(token)
}

describe('a malformed item', () => {
  const rejected: [label: string, token: string, make: (item: Json) => unknown][] = [
    ['a missing name', 'name', (item) => ({ ...item, name: undefined })],
    ['a name that is a number', 'name', (item) => ({ ...item, name: 5 })],
    ['a missing type', 'type', (item) => ({ ...item, type: undefined })],
    ['an unknown type', 'type', (item) => ({ ...item, type: 'registry:nope' })],
    ['files as a string', 'files', (item) => ({ ...item, files: 'registry/ui/kbd.tsx' })],
    [
      'a file without a path',
      'path',
      (item) => ({ ...item, files: [{ ...firstFile(item), path: undefined }] }),
    ],
    [
      'a file of an unknown type',
      'type',
      (item) => ({ ...item, files: [{ ...firstFile(item), type: 'registry:nope' }] }),
    ],
    ['dependencies as a string', 'dependencies', (item) => ({ ...item, dependencies: 'cn' })],
    ['a dependency that is a number', 'dependencies', (item) => ({ ...item, dependencies: [5] })],
    [
      'registryDependencies as an object',
      'registryDependencies',
      (item) => ({ ...item, registryDependencies: {} }),
    ],
    [
      'a registry:file without a target',
      'target',
      (item) => ({
        ...item,
        type: 'registry:file',
        files: [{ path: 'a.txt', type: 'registry:file', content: 'x' }],
      }),
    ],
    ['a string instead of an object', 'object', () => 'kbd'],
    ['null instead of an object', 'object', () => null],
    ['an array instead of an object', 'object', () => []],
  ]

  it.each(rejected)('is rejected by both validators: %s', (label, token, make) => {
    const value = make(realItem())
    expectBothReject(
      { json: jsonSchemaIssuesForItem(value), cli: cliSchemaIssuesForItem(value) },
      token,
      label,
    )
  })

  // These pass both validators today. rules.ts reports each of them, which rules.test.ts checks; if
  // a future schema starts to reject one, this test fails and the rule can be reconsidered.
  const unseen: [label: string, make: (item: Json) => unknown][] = [
    ['an empty file list', (item) => ({ ...item, files: [] })],
    [
      'a file without content',
      (item) => ({ ...item, files: [{ ...firstFile(item), content: undefined }] }),
    ],
    ['a key the registry does not emit', (item) => ({ ...item, surprise: true })],
  ]

  it.each(unseen)('is not noticed by either validator: %s', (_label, make) => {
    const value = make(realItem())
    expect(jsonSchemaIssuesForItem(value)).toEqual([])
    expect(cliSchemaIssuesForItem(value)).toEqual([])
  })
})

describe('a malformed index', () => {
  const rejected: [label: string, token: string, make: (index: Json) => unknown][] = [
    ['items as an object', 'items', (index) => ({ ...index, items: {} })],
    ['an item without a type', 'type', (index) => ({ ...index, items: [{ name: 'x' }] })],
    ['a string instead of an object', 'object', () => 'index'],
  ]

  it.each(rejected)('is rejected by both validators: %s', (label, token, make) => {
    const value = make(realIndex())
    expectBothReject(
      { json: jsonSchemaIssuesForIndex(value), cli: cliSchemaIssuesForIndex(value) },
      token,
      label,
    )
  })

  // The published JSON Schema does not require name or homepage; the Zod schema in the CLI does.
  // That is why both run.
  it.each([['name'], ['homepage']])('without %s is rejected by the CLI schema only', (field) => {
    const value = { ...realIndex(), [field]: undefined }
    expect(jsonSchemaIssuesForIndex(value)).toEqual([])
    expect(cliSchemaIssuesForIndex(value).join('\n')).toContain(field)
  })
})
