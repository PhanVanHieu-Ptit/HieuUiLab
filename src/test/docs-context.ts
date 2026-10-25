import { docNodes, docRedirects } from '@/docs/manifest'
import type { DocsContext } from '@/docs/docs-rules'
import { docSources } from '@/docs/sources'
import { parseDesignTokens } from '@/docs/tokens'
import { docsNav, flattenNavItems } from '@/config/site'
import { getImplementedEntry } from '@/registry'
import { registryRequirements } from '@/registry/packages'
import { registryCategories } from '@/registry/taxonomy'
import { isImplemented } from '@/registry/types'
import css from '@/styles/globals.css?raw'
import packageJsonSource from '../../package.json?raw'

import { fullRegistry, getLoadedEntry } from './full-registry'
import { fileExists, listFiles, pathExists, readFile } from './repo-files'
import { createRouteChecker } from './showcase-context'

/** The ids of a registry entry page's sections (`#api`, `#installation`, ...). A test checks them. */
export const registryDetailAnchors: ReadonlySet<string> = new Set([
  'examples',
  'code',
  'installation',
  'dependencies',
  'api',
  'related',
])

function dependencyNames(): Set<string> {
  const parsed = JSON.parse(packageJsonSource) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  return new Set([
    ...Object.keys(parsed.dependencies ?? {}),
    ...Object.keys(parsed.devDependencies ?? {}),
  ])
}

/**
 * The real answers for `validateDocs`: every page's Markdown, the repository's files, the router,
 * the registry, package.json, and the stylesheet. Tests only, because it reads every source file
 * as text.
 */
export async function createDocsContext(): Promise<DocsContext> {
  const pages = await Promise.all(
    docNodes.map(async (node) => ({ node, source: (await node.entry.load()).default })),
  )
  return {
    pages,
    redirects: docRedirects,
    navHrefs: new Set(
      docsNav.flatMap((section) => flattenNavItems(section.items).map((item) => item.href)),
    ),
    contentFiles: listFiles('src/docs/content/').filter((file) => file.endsWith('.md')),
    readFile,
    fileExists,
    pathExists,
    routeExists: createRouteChecker(),
    packages: dependencyNames(),
    sourcePaths: new Set(Object.keys(docSources)),
    tokenNames: new Set(parseDesignTokens(css).tokens.map((token) => token.name)),
    detailAnchors: registryDetailAnchors,
    requirementHrefs: Object.values(registryRequirements).map((requirement) => requirement.href),
    registry: {
      hasEntry: (slug) => getImplementedEntry(slug) !== undefined,
      hasPart: (slug, part) =>
        getImplementedEntry(slug)?.api.parts.some((item) => item.name === part) ?? false,
      hasExample: (slug, example) =>
        getLoadedEntry(slug)?.examples.some((item) => item.id === example) ?? false,
      hasCategory: (category) => Object.hasOwn(registryCategories, category),
      texts: fullRegistry
        .filter(isImplemented)
        .flatMap((entry) => [entry.source, ...entry.examples.map((example) => example.code)]),
    },
  }
}
