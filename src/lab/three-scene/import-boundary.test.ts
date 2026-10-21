import { describe, expect, it } from 'vitest'

import { listFiles, readFile } from '@/test/repo-files'

const DIRECTORY = 'src/lab/three-scene/'
const RUNTIME = `${DIRECTORY}runtime/`
const CONTROLLER = `${DIRECTORY}scene-controller.ts`

// Every way to name the library in code: `import x from`, `import type x from`, `export * from`,
// a bare `import 'three'`, and a dynamic `import('three')`. `import type` is erased and costs
// nothing at runtime, but it still ties a file to the library, so it counts here.
// A statement's body may not contain another `import` or `export`, because the codebase has no
// semicolons to stop at.
const THREE = String.raw`['"]three(?:\/[^'"]*)?['"]`
const RUNTIME_MODULE = String.raw`['"](?:\.\/runtime|[^'"]*three-scene\/runtime)(?:\/[^'"]*)?['"]`

function importOf(specifier: string) {
  return [
    new RegExp(
      String.raw`\b(?:import|export)\s+(?:(?!\b(?:import|export)\b)[\s\S])*?from\s+${specifier}`,
    ),
    new RegExp(String.raw`\bimport\s+${specifier}`),
  ]
}
const dynamicImportOf = (specifier: string) =>
  new RegExp(String.raw`\bimport\(\s*${specifier}\s*\)`)

const staticImportOf = (specifier: string, text: string) =>
  importOf(specifier).some((pattern) => pattern.test(text))

const sources = listFiles('src/')
  .filter((path) => /\.(ts|tsx)$/.test(path))
  .filter((path) => !/\.test\.(ts|tsx)$/.test(path))
  .map((path) => ({ path, text: readFile(path) ?? '' }))

const runtimeSources = sources.filter(({ path }) => path.startsWith(RUNTIME))

describe('where Three.js is imported', () => {
  it('finds the sources it is meant to check', () => {
    expect(sources.length).toBeGreaterThan(50)
    expect(sources.some(({ path }) => path === CONTROLLER)).toBe(true)
    expect(runtimeSources.map(({ path }) => path)).toContain(`${RUNTIME}scene-runtime.ts`)
  })

  it('is named only by the files under runtime/, so everything else stays free of it', () => {
    const offenders = sources
      .filter(({ path }) => !path.startsWith(RUNTIME))
      .filter(({ text }) => staticImportOf(THREE, text) || dynamicImportOf(THREE).test(text))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })

  it('is used by the runtime, which is the point of the folder', () => {
    const users = runtimeSources.filter(({ text }) => staticImportOf(THREE, text))
    expect(users.length).toBeGreaterThan(3)
  })

  it('has its OrbitControls import spelled the way the bundler resolves it', () => {
    const runtime = runtimeSources.find(({ path }) => path === `${RUNTIME}scene-runtime.ts`)
    expect(runtime?.text).toContain("'three/addons/controls/OrbitControls.js'")
  })
})

describe('where the runtime is imported', () => {
  it('is never imported statically from outside runtime/, so it stays out of every other chunk', () => {
    const offenders = sources
      .filter(({ path }) => !path.startsWith(RUNTIME))
      .filter(({ text }) => staticImportOf(RUNTIME_MODULE, text))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })

  it('is imported dynamically by the controller alone', () => {
    const importers = sources
      .filter(({ path }) => !path.startsWith(RUNTIME))
      .filter(({ text }) => dynamicImportOf(RUNTIME_MODULE).test(text))
      .map(({ path }) => path)
    expect(importers).toEqual([CONTROLLER])
  })
})

describe('what the runtime may depend on', () => {
  it('imports no React, site module, or icon, so the chunk holds only the renderer', () => {
    const offenders = runtimeSources
      .filter(
        ({ text }) =>
          staticImportOf(String.raw`['"](?:react|react-dom|lucide-react|radix-ui)['"]`, text) ||
          staticImportOf(String.raw`['"]@\/[^'"]*['"]`, text),
      )
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })

  it('imports nothing outside this experiment', () => {
    const offenders = runtimeSources
      .filter(({ text }) => staticImportOf(String.raw`['"]\.\.\/\.\.\/[^'"]*['"]`, text))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })
})
