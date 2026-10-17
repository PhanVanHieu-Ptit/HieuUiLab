import { describe, expect, it } from 'vitest'

import { createShowcaseContext } from '@/test/showcase-context'

import { projects } from './projects'
import { getShowcaseProject, showcaseProjects } from './showcase-projects'
import { validateShowcase } from './showcase-rules'
import { showcaseCategoryLabels, visibilityLabel } from './showcase-types'

describe('showcase projects', () => {
  it('pass every rule against the real repository', () => {
    expect(validateShowcase(showcaseProjects, createShowcaseContext())).toEqual([])
  })

  it('are all public, with a label that says so', () => {
    expect(showcaseProjects.length).toBeGreaterThan(0)
    for (const project of showcaseProjects) {
      expect(project.visibility, project.slug).toBe('public')
    }
    expect(visibilityLabel.public).toBe('Public project')
  })

  it('cover the platform, the component library, and the geospatial and 3D experiments', () => {
    expect(showcaseProjects.map((project) => project.category)).toEqual([
      'platform',
      'library',
      'experiment',
    ])
    expect(Object.keys(showcaseCategoryLabels).sort()).toEqual([
      'application',
      'experiment',
      'library',
      'platform',
    ])
  })

  it('list no application until it has a public repository and a verified live URL', () => {
    // When one is added it needs `deployment: { status: 'live', … }`; the type and the validator
    // both enforce that. Until then none is listed, because none has been verified.
    expect(showcaseProjects.filter((project) => project.category === 'application')).toEqual([])
  })

  it('look up by slug and never share one with a case study', () => {
    expect(getShowcaseProject('hieu-ui-lab-platform')?.title).toMatch(/Hieu UI Lab/)
    expect(getShowcaseProject('nope')).toBeUndefined()
    const caseStudies = new Set(projects.map((project) => project.slug))
    for (const project of showcaseProjects) {
      expect(caseStudies.has(project.slug), project.slug).toBe(false)
    }
  })

  it('link only to case studies that exist', () => {
    const caseStudies = new Set(projects.map((project) => project.slug))
    for (const project of showcaseProjects) {
      for (const slug of project.relatedCaseStudies ?? []) {
        expect(caseStudies.has(slug), `${project.slug} → ${slug}`).toBe(true)
      }
    }
  })

  it('say the site is not deployed rather than inventing a URL', () => {
    for (const project of showcaseProjects) {
      expect(project.deployment, project.slug).toEqual({ status: 'none' })
    }
  })

  it('carry no email address or mailto link', () => {
    const text = JSON.stringify(showcaseProjects)
    expect(text).not.toMatch(/@[\w-]+\.[a-z]{2,}/i)
    expect(text).not.toMatch(/mailto:/i)
  })
})
