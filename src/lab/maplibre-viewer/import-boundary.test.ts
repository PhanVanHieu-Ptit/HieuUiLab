import { describe, expect, it } from 'vitest'

import { listFiles, readFile } from '@/test/repo-files'

const CONTROLLER = 'src/lab/maplibre-viewer/map-controller.ts'

// `import type` is erased and costs nothing at runtime. Anything else, including an inline
// `import { type X }`, which `verbatimModuleSyntax` keeps as an import, loads the library.
// The body may not contain another `import`, because the codebase has no semicolons to stop at.
const STATIC_RUNTIME_IMPORT =
  /\bimport\s+(?!type\b)(?:(?!\bimport\b)[\s\S])*?from\s+['"]maplibre-gl(?:\/[^'"]*)?['"]/
const SIDE_EFFECT_IMPORT = /\bimport\s+['"]maplibre-gl(?:\/[^'"]*)?['"]/
const DYNAMIC_IMPORT = /\bimport\(\s*['"]maplibre-gl(?:\/[^'"]*)?['"]\s*\)/

const sources = listFiles('src/')
  .filter((path) => /\.(ts|tsx)$/.test(path))
  .filter((path) => !/\.test\.(ts|tsx)$/.test(path))
  .map((path) => ({ path, text: readFile(path) ?? '' }))

describe('where the map library is imported', () => {
  it('finds the sources it is meant to check', () => {
    expect(sources.length).toBeGreaterThan(50)
    expect(sources.some(({ path }) => path === CONTROLLER)).toBe(true)
  })

  it('is never imported statically, anywhere', () => {
    const offenders = sources
      .filter(({ text }) => STATIC_RUNTIME_IMPORT.test(text) || SIDE_EFFECT_IMPORT.test(text))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })

  it('is imported dynamically by the controller alone, so it stays out of every other chunk', () => {
    const importers = sources
      .filter(({ text }) => DYNAMIC_IMPORT.test(text))
      .map(({ path }) => path)
    expect(importers).toEqual([CONTROLLER])
  })
})
