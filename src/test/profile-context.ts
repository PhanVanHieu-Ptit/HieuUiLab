import { siteConfig } from '@/config/site'
import { getProjectEntry } from '@/content/project-entries'
import type { ProfileContext } from '@/content/profile-rules'
import { getNote } from '@/notes/manifest'

import { fileContains, fileExists, hasPublicAsset, readFile } from './repo-files'

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/** Names of the packages in package.json `dependencies` and `devDependencies`. */
export function installedPackages(): ReadonlySet<string> {
  const text = readFile('package.json')
  if (text === undefined) throw new Error('package.json is not readable from the test context')
  const manifest = JSON.parse(text) as PackageJson
  return new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ])
}

/**
 * The real answers for `validateProfile`: the repository's files and package.json, the projects,
 * and the notes. Tests only, because it reads every source file as text.
 */
export function createProfileContext(): ProfileContext {
  const packages = installedPackages()
  return {
    ownerProfileUrl: siteConfig.githubProfileUrl,
    fileExists,
    fileContains,
    hasPackage: (name) => packages.has(name),
    hasProject: (slug) => getProjectEntry(slug) !== undefined,
    hasNote: (slug) => getNote(slug) !== undefined,
    hasPublicAsset,
  }
}
