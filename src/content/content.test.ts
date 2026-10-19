import { describe, expect, it } from 'vitest'

import { labDemos } from '@/lab'
import { getImplementedEntry } from '@/registry'

import { experiments } from './experiments'
import {
  capabilities,
  featuredBlockSlugs,
  featuredComponentSlugs,
  featuredProjectSlugs,
  featuredShowcaseSlugs,
  featuredTemplateSlugs,
} from './landing'
import { getProject, projects } from './projects'
import { getShowcaseProject, showcaseProjects } from './showcase-projects'
import { techStack } from './tech-stack'
import { getTemplate, templates } from './templates'

function expectUnique(values: readonly string[]) {
  expect(new Set(values).size).toBe(values.length)
}

describe('content', () => {
  it('uses unique slugs per collection', () => {
    expectUnique(projects.map((project) => project.slug))
    expectUnique(experiments.map((experiment) => experiment.slug))
    expectUnique(templates.map((template) => template.slug))
    // /projects/:slug serves both, so a project and a case study can never share a slug.
    expectUnique([...projects, ...showcaseProjects].map((project) => project.slug))
  })

  it('features only implemented entries that exist', () => {
    for (const slug of featuredComponentSlugs) {
      expect(getImplementedEntry(slug, 'component'), slug).toBeDefined()
    }
    for (const slug of featuredBlockSlugs) {
      expect(getImplementedEntry(slug, 'block'), slug).toBeDefined()
    }
    for (const slug of featuredProjectSlugs) {
      expect(getProject(slug), slug).toBeDefined()
    }
    for (const slug of featuredTemplateSlugs) {
      expect(getTemplate(slug), slug).toBeDefined()
    }
    for (const slug of featuredShowcaseSlugs) {
      expect(getShowcaseProject(slug), slug).toBeDefined()
    }
  })

  it('has a demo for every experiment that is not planned', () => {
    for (const experiment of experiments) {
      if (experiment.status === 'planned') continue
      expect(labDemos[experiment.slug], experiment.slug).toBeDefined()
    }
  })

  // The engineering notes are Markdown, checked by `src/notes/notes.test.ts`.
  it('gives every case study and experiment a body', () => {
    for (const item of [...projects, ...experiments]) {
      expect(item.body.length, item.slug).toBeGreaterThan(0)
      for (const section of item.body) {
        expect(section.paragraphs.length, `${item.slug}: ${section.heading}`).toBeGreaterThan(0)
      }
    }
  })

  it('links only to app routes or https URLs', () => {
    const hrefs = [
      ...projects.flatMap((project) => project.links.map((link) => link.href)),
      ...techStack.flatMap((group) => group.items.map((item) => item.href)),
      ...capabilities.map((capability) => capability.href),
    ]
    for (const href of hrefs) {
      expect(href, href).toMatch(/^(\/[a-z0-9/-]*|https:\/\/.+)$/)
    }
  })

  it('makes no numeric performance or popularity claims in case-study outcomes', () => {
    for (const project of projects) {
      expect(project.outcome, project.slug).not.toMatch(/\d+\s*(%|x|×|ms|stars|downloads|users)/i)
    }
  })
})
