import { getProject } from './projects'
import { getShowcaseProject } from './showcase-projects'
import type { ShowcaseProject } from './showcase-types'
import type { Project } from './types'

/**
 * What `/projects/:slug` can be: a public project, or a case study of part of this lab. Slugs are
 * unique across both (a test checks it), so one URL space serves them.
 */
export type ProjectEntry =
  { kind: 'showcase'; project: ShowcaseProject } | { kind: 'case-study'; project: Project }

export function getProjectEntry(slug: string): ProjectEntry | undefined {
  const showcase = getShowcaseProject(slug)
  if (showcase) return { kind: 'showcase', project: showcase }
  const caseStudy = getProject(slug)
  return caseStudy ? { kind: 'case-study', project: caseStudy } : undefined
}
