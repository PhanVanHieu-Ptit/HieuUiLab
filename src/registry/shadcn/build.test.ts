import { describe, expect, it } from 'vitest'

import { readFile } from '@/test/repo-files'
import { builtShadcnRegistry, packageJson, shadcnRegistryContext } from '@/test/registry-context'

import { TESTED_CLI, publishedSlugs } from './config'
import { formatShadcnIssues, validateShadcnRegistry } from './rules'
import {
  cliSchemaIssuesForIndex,
  cliSchemaIssuesForItem,
  jsonSchemaIssuesForIndex,
  jsonSchemaIssuesForItem,
  schemaLock,
} from './schemas'
import indexSchemaSource from './schema/registry.schema.json?raw'
import itemSchemaSource from './schema/registry-item.schema.json?raw'

/*
 * This file is the generator. `pnpm registry:build` runs it with `-u`, which writes public/r; every
 * other run compares the committed files with what the registry produces today, so the two cannot
 * drift apart. See src/docs/content/shadcn-registry.md.
 */

const built = builtShadcnRegistry()

describe('generated files', () => {
  for (const [path, content] of Object.entries(built.files)) {
    it(`${path} matches the registry`, async () => {
      await expect(content).toMatchFileSnapshot(`../../../${path}`)
    })
  }

  it('publishes exactly the configured slugs', () => {
    expect(built.items.map((item) => item.name)).toEqual([...publishedSlugs])
  })
})

describe('schemas', () => {
  it.each(built.items.map((item) => [item.name, item] as const))(
    '%s passes the published JSON Schema and the CLI schema',
    (_name, item) => {
      expect(jsonSchemaIssuesForItem(item)).toEqual([])
      expect(cliSchemaIssuesForItem(item)).toEqual([])
    },
  )

  it('the index passes the published JSON Schema and the CLI schema', () => {
    expect(jsonSchemaIssuesForIndex(built.index)).toEqual([])
    expect(cliSchemaIssuesForIndex(built.index)).toEqual([])
  })

  it('the JSON Schema rejects an item without a type, so the check is not vacuous', () => {
    expect(jsonSchemaIssuesForItem({ name: 'x' }).length).toBeGreaterThan(0)
    expect(cliSchemaIssuesForItem({ name: 'x' }).length).toBeGreaterThan(0)
  })

  it('the vendored JSON Schemas are the files recorded in lock.json', async () => {
    const sha256 = async (text: string) => {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
      return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    }
    expect(await sha256(indexSchemaSource)).toBe(schemaLock.schemas['registry.schema.json']?.sha256)
    expect(await sha256(itemSchemaSource)).toBe(
      schemaLock.schemas['registry-item.schema.json']?.sha256,
    )
  })
})

describe('registry rules', () => {
  it('finds nothing to report in the real registry', () => {
    const issues = validateShadcnRegistry(shadcnRegistryContext())
    expect(formatShadcnIssues(issues)).toBe('')
  })
})

describe('tested CLI version', () => {
  const docs = readFile('src/docs/content/shadcn-registry.md') ?? ''
  const workflow = readFile('.github/workflows/registry-install.yml') ?? ''

  it('is the shadcn version this repository pins', () => {
    expect(packageJson.devDependencies?.shadcn).toBe(TESTED_CLI)
    expect(schemaLock.cli).toBe(TESTED_CLI)
  })

  it('is the only version the docs page names, and it never recommends @latest', () => {
    const versions = [...docs.matchAll(/shadcn@([\w.-]+)/g)].map((match) => match[1])
    expect(versions.length).toBeGreaterThan(0)
    expect(new Set(versions)).toEqual(new Set([TESTED_CLI]))
    expect(docs).toContain(`shadcn ${TESTED_CLI}`)
  })

  it('is what the install workflow runs, through the pinned devDependency', () => {
    expect(workflow).toContain('pnpm registry:install-test')
    // The workflow names no CLI version of its own: the script reads the pinned devDependency.
    expect(workflow).not.toContain('shadcn@')
  })
})
