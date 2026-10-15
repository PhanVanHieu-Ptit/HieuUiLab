import {
  defaultPlaygroundValues,
  playgroundSnippet,
  resolvePlaygroundProps,
  type PlaygroundValues,
} from './playground'
import type { ApiPart, ImplementedEntry } from './types'

/** Whether a source export is a runtime value or only a type. */
export type ExportKind = 'value' | 'type'

/** Names a source file exports, with whether each is a value or a type. */
export function sourceExports(source: string): Map<string, ExportKind> {
  const exports = new Map<string, ExportKind>()
  const declaration =
    /^export\s+(?:default\s+)?(?:async\s+)?(function|const|let|class|enum|interface|type)\s+([A-Za-z_$][\w$]*)/gm
  for (const [, keyword, name] of source.matchAll(declaration)) {
    if (name) exports.set(name, keyword === 'interface' || keyword === 'type' ? 'type' : 'value')
  }
  for (const [, typeOnly, list] of source.matchAll(/^export\s+(type\s+)?\{([^}]*)\}/gm)) {
    for (const item of (list ?? '').split(',')) {
      const [specifier = '', alias] = item.trim().split(/\s+as\s+/)
      const isType = typeOnly !== undefined || specifier.startsWith('type ')
      const name = (alias ?? specifier.replace(/^type\s+/, '')).trim()
      if (name) exports.set(name, isType ? 'type' : 'value')
    }
  }
  return exports
}

/**
 * The exported names one API part documents. A part may group several exports,
 * e.g. `DialogTitle / DialogDescription` or `DataTableColumn<T>`.
 */
export function partExportNames(part: Pick<ApiPart, 'name'>): string[] {
  return part.name
    .split(/[/,]/)
    .map((name) => name.replace(/<.*>$/, '').trim())
    .filter(Boolean)
}

/** The import specifier for an entry's target path, e.g. `@/components/ui/button`. */
export function importPath(entry: ImplementedEntry): string {
  return `@/${entry.installation.targetPath.replace(/\.tsx$/, '')}`
}

/** One import statement, wrapped to one name per line when it passes 100 columns. */
export function formatImport(names: readonly string[], from: string): string {
  const inline = `import { ${names.join(', ')} } from '${from}'`
  if (inline.length <= 100) return inline
  return `import {\n${names.map((name) => `  ${name},`).join('\n')}\n} from '${from}'`
}

/** Every documented export of an entry, as one import statement; types are marked `type`. */
export function importStatement(entry: ImplementedEntry): string {
  const exports = sourceExports(entry.source)
  const names = entry.api.parts
    .flatMap(partExportNames)
    .filter((name, index, all) => exports.has(name) && all.indexOf(name) === index)
    .map((name) => (exports.get(name) === 'type' ? `type ${name}` : name))
  return formatImport(names, importPath(entry))
}

/** Example code for the playground's part with `values`; what the preview renders. */
export function playgroundCode(entry: ImplementedEntry, values?: PlaygroundValues): string {
  const { playground } = entry
  if (!playground) return ''
  const props = resolvePlaygroundProps(playground, values ?? defaultPlaygroundValues(playground))
  return playgroundSnippet(
    formatImport([playground.part], importPath(entry)),
    playground.part,
    props,
  )
}

/** A short usage example: the playground's defaults, or else the first example's code. */
export function usageSnippet(entry: ImplementedEntry): string {
  return entry.playground ? playgroundCode(entry) : entry.examples[0].code
}
