import { registryRequirements, type PackageName } from './packages'
import { isImplemented, type ImplementedEntry, type RegistryEntry } from './types'

export interface InstallPlan {
  /** Registry entries to copy first, dependencies before dependents. */
  entries: ImplementedEntry[]
  /** Every npm package needed by the entry, its registry dependencies, and their requirements. */
  packages: PackageName[]
}

/**
 * Everything needed to use `entry` in another project, following registry
 * dependencies transitively. `lookup` resolves a slug to its entry.
 */
export function resolveInstallPlan(
  entry: ImplementedEntry,
  lookup: (slug: string) => RegistryEntry | undefined,
): InstallPlan {
  const ordered: ImplementedEntry[] = []
  const seen = new Set<string>([entry.slug])

  function visit(current: ImplementedEntry) {
    for (const slug of current.installation.registryDependencies) {
      if (seen.has(slug)) continue
      seen.add(slug)
      const dependency = lookup(slug)
      if (!dependency || !isImplemented(dependency)) continue
      visit(dependency)
      ordered.push(dependency)
    }
  }
  visit(entry)

  const packages = new Set<PackageName>()
  for (const item of [...ordered, entry]) {
    for (const name of item.installation.packages) packages.add(name)
    for (const id of item.installation.requirements) {
      for (const name of registryRequirements[id].packages) packages.add(name)
    }
  }

  return { entries: ordered, packages: [...packages].sort() }
}
