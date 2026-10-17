import { matchRoutes } from 'react-router'

import { docsNav, labsNav, mainNav, siteConfig } from '@/config/site'
import { experimentHref, experiments } from '@/content/experiments'
import { projects } from '@/content/projects'
import type { ShowcaseContext } from '@/content/showcase-rules'
import { showcaseProjects } from '@/content/showcase-projects'
import { templates } from '@/content/templates'
import { labDemos } from '@/lab'
import { getImplementedEntry } from '@/registry'
import { createRoutes } from '@/router/routes'

import { fileContains, fileExists, hasPublicAsset } from './repo-files'

/** Every in-app path the site links to or serves from typed data, for checking `route-link` media. */
function knownPaths(): Set<string> {
  return new Set([
    ...mainNav.map((item) => item.href),
    ...docsNav.flatMap((section) => section.items.map((item) => item.href)),
    ...labsNav.items.map((item) => item.href),
    ...experiments.map((experiment) => experimentHref(experiment)),
    ...projects.map((project) => `/projects/${project.slug}`),
    ...showcaseProjects.map((project) => `/projects/${project.slug}`),
  ])
}

/**
 * The real answers for `validateShowcase`: the repository's files, the lab demos, the registry, the
 * templates, and the router. Tests only, because it reads every source file as text.
 */
export function createShowcaseContext(): ShowcaseContext {
  const routes = createRoutes()
  const known = knownPaths()

  return {
    ownerProfileUrl: siteConfig.githubProfileUrl,
    fileExists,
    fileContains,
    hasLabDemo: (slug) =>
      Object.hasOwn(labDemos, slug) && experiments.some((experiment) => experiment.slug === slug),
    hasRegistryExample: (entry, kind, example) =>
      getImplementedEntry(entry, kind)?.examples.some((item) => item.id === example) ?? false,
    hasTemplate: (slug) => templates.some((template) => template.slug === slug),
    hasPublicAsset,
    // A path counts only if the site links to it or serves it from data, and the router resolves
    // it to a page rather than the not-found route. Matching alone would accept "/components/typo".
    routeExists: (href) => {
      const last = matchRoutes(routes, href)?.at(-1)
      return known.has(href) && last !== undefined && last.route.path !== '*'
    },
    caseStudySlugs: projects.map((project) => project.slug),
  }
}
