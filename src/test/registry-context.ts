import { siteConfig } from '@/config/site'
import { registry } from '@/registry'
import { publishedSlugs, shadowsBuiltin } from '@/registry/shadcn/config'
import { buildShadcnRegistry, type ShadcnRegistry } from '@/registry/shadcn/manifest'
import type { ShadcnRegistryContext } from '@/registry/shadcn/rules'
import globalsCss from '@/styles/globals.css?raw'
import packageJsonSource from '../../package.json?raw'

import { publicAssetPaths, readFile } from './repo-files'

export const packageJson = JSON.parse(packageJsonSource) as {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/** What the generator produces today from the real registry. */
export function builtShadcnRegistry(): ShadcnRegistry {
  return buildShadcnRegistry(registry, publishedSlugs, siteConfig.githubUrl)
}

/**
 * The real answers for `validateShadcnRegistry`: the generated items, the site registry, the
 * committed files under `public/r`, package.json and the stylesheet. Tests only, because it reads
 * repository files as text.
 */
export function shadcnRegistryContext(): ShadcnRegistryContext {
  const { items, index } = builtShadcnRegistry()
  return {
    entries: registry,
    publishedSlugs,
    shadowsBuiltin,
    items,
    index,
    publicFiles: publicAssetPaths('/r/'),
    readFile,
    packageDependencies: { ...packageJson.dependencies, ...packageJson.devDependencies },
    globalsCss,
  }
}
