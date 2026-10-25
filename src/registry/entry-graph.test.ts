import { describe, expect, it } from 'vitest'

import { listFiles, readFile } from '@/test/repo-files'

// What a visitor downloads before anything is shown is the static import graph of `src/main.tsx`:
// every module it reaches without an `import()`. Registry entries keep their demos and their source
// text in a `content.ts` loaded with `import()`, so none of that may be reachable from here. A
// build would not complain if someone imported a demo from the navigation: the page would just
// start shipping all of them again. This reads the sources and says which import did it.

const ENTRY = 'src/main.tsx'

/** Packages that belong to a page the visitor has not opened, not to every page. */
const LAZY_PACKAGES = [
  'zod',
  'react-hook-form',
  '@hookform/resolvers',
  'shiki',
  'marked',
  'maplibre-gl',
  'three',
]

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1')
}

// `import type` is erased and costs nothing at runtime. Anything else, including an inline
// `import { type X }`, which `verbatimModuleSyntax` keeps as an import, loads the module. A body
// may not contain another `import` or `export`, because the codebase has no semicolons to stop at.
const FROM_IMPORT =
  /\b(?:import|export)\s+(?!type\b)(?:(?!\bimport\b|\bexport\b)[\s\S])*?\bfrom\s+['"]([^'"]+)['"]/g
const SIDE_EFFECT_IMPORT = /\bimport\s+['"]([^'"]+)['"]/g

function staticSpecifiers(text: string): string[] {
  const code = stripComments(text)
  return [...code.matchAll(FROM_IMPORT), ...code.matchAll(SIDE_EFFECT_IMPORT)].map(
    (match) => match[1] ?? '',
  )
}

const exists = (path: string) => readFile(path) !== undefined

/** The source file a module specifier names, or undefined for a package or an asset. */
function resolveSource(from: string, specifier: string): string | undefined {
  const base = specifier.startsWith('@/')
    ? `src/${specifier.slice(2)}`
    : specifier.startsWith('.')
      ? joinPath(from.slice(0, from.lastIndexOf('/')), specifier)
      : undefined
  if (base === undefined) return undefined
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find(exists)
}

function joinPath(directory: string, relative: string): string {
  const parts = directory.split('/')
  for (const part of relative.split('/')) {
    if (part === '..') parts.pop()
    else if (part !== '.') parts.push(part)
  }
  return parts.join('/')
}

function packageName(specifier: string): string {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? '')
}

interface Graph {
  files: Set<string>
  packages: Set<string>
  /** Imports that carry a query, such as `?raw`, with the file that has them. */
  queries: { file: string; specifier: string }[]
}

function staticGraph(entry: string): Graph {
  const graph: Graph = { files: new Set(), packages: new Set(), queries: [] }
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.shift() ?? ''
    if (graph.files.has(file)) continue
    graph.files.add(file)
    if (!/\.(ts|tsx)$/.test(file)) continue
    for (const specifier of staticSpecifiers(readFile(file) ?? '')) {
      if (specifier.includes('?')) {
        graph.queries.push({ file, specifier })
        continue
      }
      const target = resolveSource(file, specifier)
      if (target) queue.push(target)
      else if (!specifier.startsWith('.') && !specifier.startsWith('@/')) {
        graph.packages.add(packageName(specifier))
      }
    }
  }
  return graph
}

const graph = staticGraph(ENTRY)

describe('what the entry loads before any page is chosen', () => {
  it('finds the modules it is meant to check', () => {
    expect(graph.files.size).toBeGreaterThan(100)
    for (const file of [ENTRY, 'src/router/routes.tsx', 'src/registry/index.ts']) {
      expect(graph.files.has(file), file).toBe(true)
    }
    // The navigation reads every entry's metadata, so those files are meant to be here.
    expect(graph.files.has('src/registry/button/meta.ts')).toBe(true)
  })

  it('reaches no registry entry file but its metadata', () => {
    const offenders = [...graph.files].filter(
      (file) => /^src\/registry\/[^/]+\/[^/]+$/.test(file) && !file.endsWith('/meta.ts'),
    )
    expect(offenders).toEqual([])
  })

  it('imports no component or demo source as text, so no entry ships its code twice', () => {
    // package.json is read as text for the version column, and that is small and needed everywhere.
    expect(graph.queries.filter(({ specifier }) => /\.tsx?\?raw$/.test(specifier))).toEqual([])
  })

  it('reaches no library that belongs to a page the visitor has not opened', () => {
    expect(LAZY_PACKAGES.filter((name) => graph.packages.has(name))).toEqual([])
  })
})

describe('registry entry metadata', () => {
  const metas = listFiles('src/registry/').filter((file) =>
    /^src\/registry\/[^/]+\/meta\.ts$/.test(file),
  )

  it('finds the metadata files', () => {
    expect(metas.length).toBeGreaterThan(40)
  })

  it.each(metas)('%s loads its content with one import() and imports nothing heavy', (file) => {
    const text = stripComments(readFile(file) ?? '')
    expect([...text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1])).toEqual([
      './content',
    ])
    expect(staticSpecifiers(text).filter((specifier) => !specifier.startsWith('../'))).toEqual([])
    expect(text).not.toMatch(/\?raw/)
    expect(exists(file.replace(/meta\.ts$/, 'content.ts')), 'has a content.ts beside it').toBe(true)
  })
})
