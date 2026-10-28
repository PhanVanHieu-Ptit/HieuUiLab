import { describe, expect, it } from 'vitest'

import { getImplementedEntry } from '@/registry'
import { parseSourceImports } from '@/registry/validate'
import { fileExists, readFile } from '@/test/repo-files'
import { templateModuleSlugs } from '@/templates/template-modules'

import { findUnsupportedClaim } from './showcase-rules'
import { getTemplate, templateBlocks, templateHref, templateSlugs, templates } from './templates'

describe('template manifests', () => {
  it('has one manifest and one loader for every slug', () => {
    expect(templates.map((template) => template.slug)).toEqual([...templateSlugs])
    expect([...templateModuleSlugs].sort()).toEqual([...templateSlugs].sort())
  })

  it('looks templates up by slug', () => {
    expect(getTemplate('admin-dashboard')?.title).toBe('Admin dashboard')
    expect(getTemplate('nope')).toBeUndefined()
    expect(templateHref({ slug: 'admin-dashboard' })).toBe('/templates/admin-dashboard')
  })

  it.each(templates)('$slug is built only from implemented blocks', (template) => {
    const blocks = templateBlocks(template)
    expect(blocks.length).toBeGreaterThan(0)
    for (const slug of blocks) {
      expect(getImplementedEntry(slug, 'block'), slug).toBeDefined()
    }
  })

  it.each(templates)('$slug lists real files, the template component first', (template) => {
    expect(template.files[0]).toBe(`src/templates/${template.slug}/template.tsx`)
    for (const path of [...template.files, ...template.mockData.map((item) => item.path)]) {
      expect(fileExists(path), path).toBe(true)
    }
  })

  it.each(templates)(
    '$slug lists every file of its own it imports, so it can be copied',
    (template) => {
      const listed = new Set([...template.files, ...template.mockData.map((item) => item.path)])
      const wanted = new Set<string>()
      for (const path of template.files) {
        const source = readFile(path)
        expect(source, path).toBeDefined()
        for (const match of (source ?? '').matchAll(/from '@\/(registry|templates)\/([^']+)'/g)) {
          const base = `src/${match[1] ?? ''}/${match[2] ?? ''}`
          const resolved = [`${base}.ts`, `${base}.tsx`].find((candidate) => fileExists(candidate))
          expect(resolved, `${path} imports ${match[0]}, which is not a file`).toBeDefined()
          if (resolved !== undefined) wanted.add(resolved)
        }
      }
      for (const path of wanted) {
        expect(listed.has(path), `${template.slug} imports ${path}, which it does not list`).toBe(
          true,
        )
      }
    },
  )

  it.each(templates)('$slug lists exactly the blocks its source imports', (template) => {
    const source = readFile(template.files[0])
    expect(source, template.files[0]).toBeDefined()
    const imported = [...parseSourceImports(source ?? '').registryFiles]
      .filter((file) => file.startsWith('components/blocks/'))
      .map((file) => file.slice('components/blocks/'.length, -'.tsx'.length))
    expect(imported.sort()).toEqual(templateBlocks(template).sort())
  })

  it.each(templates)('$slug gives every view a distinct label', (template) => {
    const labels = template.views.map((view) => view.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it.each(templates)('$slug says its data is invented', (template) => {
    expect(template.scenario).toMatch(/made-up|invented|example/i)
  })

  it('makes no numeric, customer, or production claims', () => {
    for (const template of templates) {
      const prose = [
        template.title,
        template.summary,
        template.scenario,
        ...template.views.flatMap((view) => [view.label, view.summary]),
        ...template.composition,
        ...template.decisions.flatMap((decision) => [decision.title, decision.rationale]),
        ...template.limitations,
      ]
      for (const text of prose) {
        expect(findUnsupportedClaim(text), `${template.slug}: ${text}`).toBeUndefined()
      }
    }
  })
})
