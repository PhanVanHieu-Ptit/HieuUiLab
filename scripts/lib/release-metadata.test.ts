import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

// What a person who wants to use, fork, or redistribute this repository needs to find, and that the
// notices keep up with the dependencies. The release audit found no license file, no license field,
// and no notice for the fonts and map library that ship in the build.

const repoRoot = path.resolve(import.meta.dirname, '..', '..')
const read = (file: string) => readFileSync(path.join(repoRoot, file), 'utf8')

interface Manifest {
  private?: boolean
  version: string
  description?: string
  license?: string
  author?: string
  repository?: { type?: string; url?: string }
  dependencies: Record<string, string>
}

const manifest = JSON.parse(read('package.json')) as Manifest
const notices = read('THIRD-PARTY-NOTICES.md')

/** The rows of the notices table: package name to [range, license]. */
function noticeRows(): Map<string, [range: string, license: string]> {
  const rows = new Map<string, [string, string]>()
  for (const line of notices.split('\n')) {
    const cells = /^\|\s*`([^`]+)`\s*\|([^|]+)\|([^|]+)\|/.exec(line)
    if (cells?.[1] && cells[2] && cells[3]) rows.set(cells[1], [cells[2].trim(), cells[3].trim()])
  }
  return rows
}

function installedLicense(name: string): string {
  const installed = JSON.parse(
    readFileSync(path.join(repoRoot, 'node_modules', name, 'package.json'), 'utf8'),
  ) as { license?: string }
  return installed.license ?? 'none declared'
}

describe('the license', () => {
  it('is the MIT License, in LICENSE and in package.json, held by the name the site uses', () => {
    expect(manifest.license).toBe('MIT')
    const text = read('LICENSE')
    expect(text.startsWith('MIT License\n')).toBe(true)
    expect(text).toMatch(/^Copyright \(c\) \d{4} Hieu$/m)
    expect(text).toContain('Permission is hereby granted, free of charge')
  })

  it('leaves the package private, because nothing is published', () => {
    expect(manifest.private).toBe(true)
  })

  it('says what the package is and where its source is', () => {
    expect(manifest.description?.length ?? 0).toBeGreaterThan(20)
    expect(manifest.repository?.url).toMatch(/^git\+https:\/\/github\.com\/[\w-]+\/[\w-]+\.git$/)
    expect(manifest.author).toBeTruthy()
  })

  it('is named in the README', () => {
    expect(read('README.md')).toMatch(/^## License$/m)
    expect(read('README.md')).toContain('LICENSE')
  })
})

describe('the third-party notices', () => {
  const rows = noticeRows()

  it('list every package the site ships, and no other', () => {
    expect([...rows.keys()].sort()).toEqual(Object.keys(manifest.dependencies).sort())
  })

  it.each(Object.keys(manifest.dependencies))(
    '%s is listed with the version range and the license it declares',
    (name) => {
      expect(
        existsSync(path.join(repoRoot, 'node_modules', name, 'package.json')),
        `${name} is not installed; run pnpm install`,
      ).toBe(true)
      const row = rows.get(name)
      expect(row, `${name} is missing from THIRD-PARTY-NOTICES.md`).toBeDefined()
      expect(row?.[0], `${name}: range differs from package.json`).toBe(manifest.dependencies[name])
      expect(row?.[1], `${name}: license differs from the installed package`).toBe(
        installedLicense(name),
      )
    },
  )

  it('carry the license texts that ask to travel with a copy', () => {
    const needed: Record<string, string> = {
      'BSD 3-Clause (maplibre-gl)': 'Redistribution and use in source and binary forms',
      'Apache 2.0 (class-variance-authority)':
        'Apache License\n                           Version 2.0',
      'SIL Open Font License (the two font packages)': 'SIL OPEN FONT LICENSE Version 1.1',
      MIT: 'Permission is hereby granted, free of charge',
      'ISC (lucide-react)': 'Permission to use, copy, modify, and/or distribute this software',
    }
    for (const [what, fragment] of Object.entries(needed)) {
      expect(notices, `${what}: license text is missing`).toContain(fragment)
    }
  })

  it('uses only licenses that allow redistribution of the build', () => {
    const allowed = new Set(['MIT', 'ISC', 'BSD-3-Clause', 'Apache-2.0', 'OFL-1.1'])
    for (const [name, [, license]] of rows) {
      expect(allowed.has(license), `${name} is ${license}; read it before shipping`).toBe(true)
    }
  })
})
