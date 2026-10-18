import type { Directive } from './directives'
import { DOCS_BASE, docFile, type DocNode } from './manifest'
import {
  parseMarkdown,
  plainText,
  walkBlocks,
  walkInlines,
  type Block,
  type ParsedDoc,
} from './markdown'

// The rules every documentation page must follow, as a pure function over an injected context
// (the same shape as `validateShowcase`). `src/test/docs-context.ts` supplies the real answers:
// the repository's files, the router, the registry, and package.json. Tests give it bad data to
// show each rule fires. Run it with `pnpm docs:check`, or as part of `pnpm test`.

export interface DocsContext {
  /** Every page with the Markdown its loader returns. */
  pages: readonly { node: DocNode; source: string }[]
  redirects: Readonly<Record<string, string>>
  /** The URLs the docs sidebar links to. */
  navHrefs: ReadonlySet<string>
  /** The Markdown files in `src/docs/content/`. */
  contentFiles: readonly string[]
  /** The text of a file on disk, or undefined when there is none. */
  readFile(path: string): string | undefined
  fileExists(path: string): boolean
  /** True for a file or a directory. */
  pathExists(path: string): boolean
  /** True when the site links to or serves the path and the router resolves it to a page. */
  routeExists(path: string): boolean
  /** The npm packages the project depends on. */
  packages: ReadonlySet<string>
  /** The repository files a page may show with `::source`. */
  sourcePaths: ReadonlySet<string>
  /** The design tokens in globals.css, without their dashes. */
  tokenNames: ReadonlySet<string>
  /** The ids of the sections on a registry entry's page. */
  detailAnchors: ReadonlySet<string>
  /** Where the registry's setup requirements link to. */
  requirementHrefs: readonly string[]
  registry: {
    hasEntry(slug: string): boolean
    hasPart(slug: string, part: string): boolean
    hasExample(slug: string, example: string): boolean
    hasCategory(category: string): boolean
    /** The source and example code of every implemented entry, to catch pasted copies. */
    texts: readonly string[]
  }
}

/** Fence languages the docs use. `bash` and `text` are shown without highlighting. */
export const fenceLanguages = ['tsx', 'ts', 'json', 'css', 'bash', 'text'] as const

const ROOT_FILES = new Set([
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'index.html',
  'vite.config.ts',
  'playwright.config.ts',
  'eslint.config.js',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'pnpm-lock.yaml',
])

/** An inline code span that is meant as a path in this repository. */
const REPO_PATH =
  /^(?:(?:src|e2e|public|\.github)\/[\w./@-]*|[\w.-]+\.(?:json|md|html|ts|js|yaml))$/

const HTML_ENTITY = /&(?:#\d+|#x[\da-f]+|[a-z][a-z\d]*);/i

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Words that promise what is not built. The docs say what exists, and say what does not. */
const PLACEHOLDERS =
  /\b(?:TODO|TBD|coming soon|upcoming|will soon|in a future (?:release|version))\b/i

/**
 * Spellings to keep consistent across pages. The pattern finds a term in running text (code spans
 * are not checked); only the spellings in `accepted` are allowed.
 */
const TERMS: readonly { pattern: RegExp; accepted: readonly string[] }[] = [
  { pattern: /\bgithub\b/gi, accepted: ['GitHub'] },
  { pattern: /\btype ?script\b/gi, accepted: ['TypeScript'] },
  { pattern: /\bjava ?script\b/gi, accepted: ['JavaScript'] },
  { pattern: /\bnode\.? ?js\b/gi, accepted: ['Node.js'] },
  { pattern: /\bpnpm\b/gi, accepted: ['pnpm'] },
  { pattern: /\btailwind(?: ?css)?\b/gi, accepted: ['Tailwind', 'Tailwind CSS'] },
  { pattern: /\bhieu[ -]?ui[ -]?lab\b/gi, accepted: ['Hieu UI Lab'] },
  { pattern: /\bplaywright\b/gi, accepted: ['Playwright'] },
  { pattern: /\bvitest\b/gi, accepted: ['Vitest'] },
  { pattern: /\beslint\b/gi, accepted: ['ESLint'] },
  { pattern: /\bprettier\b/gi, accepted: ['Prettier'] },
  { pattern: /\bshiki\b/gi, accepted: ['Shiki'] },
  { pattern: /\bdata[ -]?table\b/gi, accepted: ['data table', 'Data table', 'DataTable'] },
]

interface Page {
  node: DocNode
  source: string
  doc: ParsedDoc
  headingIds: ReadonlySet<string>
}

type Report = (id: string, message: string) => void

function excerpt(text: string): string {
  const flat = text.trim().replace(/\s+/g, ' ')
  return flat.length > 48 ? `${flat.slice(0, 48)}…` : flat
}

/** Module specifiers a code sample imports. */
function importSpecifiers(source: string): string[] {
  return [
    ...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g),
    ...source.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm),
    ...source.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map((match) => match[1] ?? '')
}

function packageName(specifier: string): string {
  const segments = specifier.split('/')
  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : (segments[0] ?? '')
}

/** Why `href`, written in a page, does not lead anywhere real; undefined when it does. */
function linkProblem(
  href: string,
  ctx: DocsContext,
  pages: ReadonlyMap<string, Page>,
  here?: Page,
): string | undefined {
  if (href.startsWith('https://')) return undefined
  if (href.startsWith('http://')) return `link ${href} is not https`
  if (href.startsWith('#')) {
    const id = href.slice(1)
    if (here === undefined) return `link ${href} has no page to point into`
    return here.headingIds.has(id) ? undefined : `link ${href} points at no heading on this page`
  }
  if (!href.startsWith('/')) {
    return `link "${href}" must be an https:// URL, a /path on this site, or a #heading`
  }
  const [beforeHash = '', hash] = href.split('#')
  const path = beforeHash.split('?')[0] ?? ''
  const moved = ctx.redirects[path]
  if (moved !== undefined) return `link ${href} uses ${path}, which moved to ${moved}`

  if (path === DOCS_BASE || path.startsWith(`${DOCS_BASE}/`)) {
    const target = pages.get(path)
    if (!target) return `link ${href} is not a docs page`
    if (hash && !target.headingIds.has(hash)) {
      return `link ${href} points at no heading on ${path}`
    }
    return undefined
  }
  if (!ctx.routeExists(path)) return `link ${href} is not a page on this site`
  if (hash) {
    // Only the sections of a registry entry's page are known; anything else cannot be checked.
    if (!/^\/(?:components|blocks)\/[^/]+$/.test(path)) {
      return `link ${href} has a #heading that cannot be checked; link to the page instead`
    }
    if (!ctx.detailAnchors.has(hash)) {
      return `link ${href} points at #${hash}, which is not a section of a registry entry page`
    }
  }
  return undefined
}

function validateManifest(ctx: DocsContext, report: Report): void {
  const ids = new Set<string>()
  const hrefs = new Set<string>()
  const titles = new Set<string>()
  const files = new Set<string>()

  for (const { node, source } of ctx.pages) {
    const { entry } = node
    const id = entry.id
    if (ids.has(id)) report(id, 'the id is used by another page')
    ids.add(id)
    if (hrefs.has(node.href)) report(id, `the URL ${node.href} is used by another page`)
    hrefs.add(node.href)
    if (titles.has(entry.title)) report(id, `the title "${entry.title}" is used by another page`)
    titles.add(entry.title)

    if (!/^[a-z][a-z\d-]*$/.test(id)) report(id, 'the id must be kebab-case')
    if (entry.slug !== '' && !/^[a-z][a-z\d-]*$/.test(entry.slug)) {
      report(id, `the slug "${entry.slug}" must be kebab-case`)
    }
    if (entry.title.trim() === '') report(id, 'the title is empty')
    if (!entry.description.endsWith('.')) {
      report(id, 'the description must be a sentence ending with a period')
    }
    if (!ctx.navHrefs.has(node.href)) report(id, `${node.href} is missing from the docs sidebar`)

    const file = docFile(entry)
    files.add(file)
    const onDisk = ctx.readFile(file)
    if (onDisk === undefined) report(id, `its file ${file} does not exist`)
    else if (onDisk !== source) report(id, `its loader returns something other than ${file}`)
  }

  if (!hrefs.has(DOCS_BASE)) report('manifest', `there is no index page at ${DOCS_BASE}`)

  for (const file of ctx.contentFiles) {
    if (!files.has(file)) report('manifest', `${file} belongs to no page in the manifest`)
  }

  for (const [from, to] of Object.entries(ctx.redirects)) {
    if (!from.startsWith(`${DOCS_BASE}/`)) report('manifest', `redirect ${from} is not under /docs`)
    if (hrefs.has(from)) report('manifest', `${from} is both a page and a redirect`)
    if (!hrefs.has(to)) report('manifest', `redirect ${from} points at ${to}, which is not a page`)
  }
}

function validateHeadings(page: Page, report: Report): void {
  const id = page.node.entry.id
  const { doc } = page
  if (doc.title !== page.node.entry.title) {
    report(
      id,
      doc.title === undefined
        ? `the file must start with "# ${page.node.entry.title}"`
        : `the file starts with "# ${doc.title}" but the manifest title is "${page.node.entry.title}"`,
    )
  }
  if (doc.h1Count > 1) report(id, 'has more than one # heading; the first line is the only h1')

  const headings = page.doc.blocks.filter(
    (block): block is Extract<Block, { type: 'heading' }> => block.type === 'heading',
  )
  if (!headings.some((heading) => heading.depth === 2)) report(id, 'has no ## section')

  let previous = 1
  const seen = new Set<string>()
  for (const heading of headings) {
    // A second h1 is reported once, above.
    if (heading.depth < 2) continue
    if (heading.depth > 4) {
      report(id, `heading "${heading.text}" is h${String(heading.depth)}; use ##, ###, or ####`)
      continue
    }
    if (heading.depth > previous + 1) {
      report(
        id,
        `heading "${heading.text}" skips from h${String(previous)} to h${String(heading.depth)}`,
      )
    }
    previous = heading.depth
    if (heading.text.trim() === '') report(id, 'has an empty heading')
    if (heading.id === 'main') report(id, 'heading "main" would take the id of the page body')
    if (seen.has(heading.id)) report(id, `two headings have the id "${heading.id}"`)
    seen.add(heading.id)
  }
}

function validateContent(
  page: Page,
  ctx: DocsContext,
  pages: ReadonlyMap<string, Page>,
  report: Report,
) {
  const id = page.node.entry.id
  const blocks = page.doc.blocks

  walkBlocks(blocks, (block) => {
    if (block.type === 'unsupported') {
      report(id, `${block.reason}: "${excerpt(block.raw)}"`)
    } else if (block.type === 'invalid-directive') {
      report(id, `${block.error}: "${excerpt(block.raw)}"`)
    } else if (block.type === 'code') {
      validateFence(block, page, ctx, report)
    } else if (block.type === 'directive') {
      validateDirective(block.directive, page, ctx, report)
    } else if (block.type === 'table') {
      validateTable(block, id, ctx, report)
    } else if (block.type === 'alert' && block.blocks.length === 0) {
      report(id, 'has an alert with no text')
    }
  })

  const exampleIds = new Map<string, string>()
  walkBlocks(blocks, (block) => {
    if (block.type !== 'directive' || block.directive.name !== 'registry-example') return
    const { slug = '', example = '' } = block.directive.attrs
    const owner = exampleIds.get(example)
    // ComponentPreview anchors each example as #example-<id>, so a repeated id repeats a DOM id.
    if (owner !== undefined && owner !== slug) {
      report(id, `examples "${slug}" and "${owner}" both have the id "${example}" on one page`)
    }
    exampleIds.set(example, slug)
  })

  walkInlines(blocks, (inline) => {
    if (inline.type === 'unsupported') {
      report(id, `${inline.reason}: "${excerpt(inline.raw)}"`)
    } else if (inline.type === 'link') {
      const problem = linkProblem(inline.href, ctx, pages, page)
      if (problem) report(id, problem)
    } else if (inline.type === 'code') {
      const text = inline.text
      if (REPO_PATH.test(text) && (text.includes('/') || ROOT_FILES.has(text))) {
        if (!ctx.pathExists(text.replace(/\/$/, ''))) {
          report(id, `${text} does not exist in the repository`)
        }
      }
    } else if (inline.type === 'text') {
      validateText(inline.text, id, report)
    }
  })
}

function validateText(text: string, id: string, report: Report): void {
  const entity = HTML_ENTITY.exec(text)
  if (entity) {
    report(
      id,
      `contains the HTML entity ${entity[0]}; write the character itself, since entities are shown as typed`,
    )
  }
  const placeholder = PLACEHOLDERS.exec(text)
  if (placeholder)
    report(id, `says "${placeholder[0]}"; document what exists, not what is promised`)
  if (/\be2e\b/i.test(text))
    report(id, 'writes "e2e" in prose; write "end-to-end" (e2e is for paths and commands)')
  for (const { pattern, accepted } of TERMS) {
    for (const match of text.matchAll(pattern)) {
      if (!accepted.includes(match[0])) {
        report(id, `writes "${match[0]}"; the spelling is "${accepted.join('" or "')}"`)
      }
    }
  }
}

function validateFence(
  block: Extract<Block, { type: 'code' }>,
  page: Page,
  ctx: DocsContext,
  report: Report,
): void {
  const id = page.node.entry.id
  const label = block.attrs.title ?? (block.lang || 'untitled')
  if (block.error) report(id, `code block "${label}": ${block.error}`)
  if (!(fenceLanguages as readonly string[]).includes(block.lang)) {
    report(
      id,
      `code block "${label}" ${block.lang === '' ? 'has no language' : `has the language "${block.lang}"`}; use ${fenceLanguages.join(', ')}`,
    )
  }
  for (const key of Object.keys(block.attrs)) {
    if (key !== 'title') report(id, `code block "${label}" has the unknown attribute "${key}"`)
  }
  if (!block.attrs.title) {
    report(
      id,
      `a ${block.lang || 'plain'} code block has no title="…"; the title names what is copied`,
    )
  }

  if (block.lang !== 'ts' && block.lang !== 'tsx') return

  for (const specifier of importSpecifiers(block.text)) {
    const problem = importProblem(specifier, ctx)
    if (problem) report(id, `code block "${label}" ${problem}`)
  }
  const code = block.text.trim()
  if (code.length >= 80 && code.split('\n').length >= 3) {
    if (ctx.registry.texts.some((text) => text.includes(code))) {
      report(
        id,
        `code block "${label}" copies code from a registry entry; show it with ::registry-example or link to the entry`,
      )
    }
  }
}

function importProblem(specifier: string, ctx: DocsContext): string | undefined {
  if (specifier.startsWith('.')) {
    return `imports "${specifier}"; examples import with the @/ alias or a package name`
  }
  if (specifier.startsWith('node:')) return undefined
  if (specifier.startsWith('@/')) {
    const base = `src/${specifier.slice(2).split('?')[0] ?? ''}`
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]
    return candidates.some((candidate) => ctx.fileExists(candidate))
      ? undefined
      : `imports "${specifier}", which is no file under src/`
  }
  const name = packageName(specifier)
  return ctx.packages.has(name)
    ? undefined
    : `imports "${name}", which is not a dependency in package.json`
}

function validateDirective(
  directive: Directive,
  page: Page,
  ctx: DocsContext,
  report: Report,
): void {
  const id = page.node.entry.id
  const { slug = '', part, example = '', category, path = '' } = directive.attrs
  const where = `::${directive.name}`
  switch (directive.name) {
    case 'registry-api':
      if (!ctx.registry.hasEntry(slug))
        report(id, `${where} names "${slug}", which is no implemented registry entry`)
      else if (part && !ctx.registry.hasPart(slug, part))
        report(id, `${where} names the part "${part}", which "${slug}" does not document`)
      break
    case 'registry-example':
      if (!ctx.registry.hasEntry(slug))
        report(id, `${where} names "${slug}", which is no implemented registry entry`)
      else if (!ctx.registry.hasExample(slug, example))
        report(id, `${where} names the example "${example}", which "${slug}" does not have`)
      break
    case 'registry-index':
      if (category && !ctx.registry.hasCategory(category))
        report(id, `${where} names "${category}", which is no registry category`)
      break
    case 'source':
      if (!ctx.sourcePaths.has(path))
        report(id, `${where} names "${path}", which is not in src/docs/sources.ts`)
      break
  }
}

function validateTable(
  table: Extract<Block, { type: 'table' }>,
  id: string,
  ctx: DocsContext,
  report: Report,
): void {
  const header = table.header.map((cell) => plainText(cell).trim().toLowerCase())
  if (header.includes('prop') && header.includes('type')) {
    report(id, 'has a Prop and Type table; generate it with ::registry-api so it cannot drift')
  }
  for (const row of table.rows) {
    const first = row[0]?.[0]
    if (
      first?.type === 'code' &&
      first.text.startsWith('--') &&
      ctx.tokenNames.has(first.text.slice(2))
    ) {
      report(
        id,
        `lists the token ${first.text} by hand; generate token tables with ::design-tokens`,
      )
    }
  }
}

function validateChangelog(page: Page, report: Report): void {
  const id = page.node.entry.id
  const sections = page.doc.blocks.reduce<{ title: string; hasList: boolean }[]>((all, block) => {
    if (block.type === 'heading' && block.depth === 2)
      all.push({ title: block.text, hasList: false })
    else if (block.type === 'list') {
      const last = all.at(-1)
      if (last) last.hasList = true
    }
    return all
  }, [])
  if (sections[0]?.title !== 'Unreleased') report(id, 'the first ## section must be "Unreleased"')
  let previous: string | undefined
  for (const section of sections.slice(1)) {
    // Date.parse accepts 2026-02-30 and rolls it over, so compare the round trip too.
    const valid =
      ISO_DATE.test(section.title) &&
      !Number.isNaN(Date.parse(section.title)) &&
      new Date(section.title).toISOString().startsWith(section.title)
    if (!valid) {
      report(id, `section "${section.title}" must be a date like 2026-10-16`)
      continue
    }
    if (previous !== undefined && section.title >= previous) {
      report(id, `section ${section.title} must come before ${previous}; newest first`)
    }
    previous = section.title
  }
  for (const section of sections) {
    if (!section.hasList) report(id, `section "${section.title}" lists no changes`)
  }
}

/** Every problem in the documentation, as `docs/<page id>: message`. Empty when it is sound. */
export function validateDocs(ctx: DocsContext): string[] {
  const issues: string[] = []
  const report: Report = (id, message) => issues.push(`docs/${id}: ${message}`)

  validateManifest(ctx, report)

  const pages = new Map<string, Page>()
  for (const { node, source } of ctx.pages) {
    const doc = parseMarkdown(source)
    pages.set(node.href, {
      node,
      source,
      doc,
      headingIds: new Set(doc.headings.map((heading) => heading.id)),
    })
  }

  for (const page of pages.values()) {
    validateHeadings(page, report)
    validateContent(page, ctx, pages, report)
    if (docFile(page.node.entry) === 'CHANGELOG.md') validateChangelog(page, report)
  }

  for (const href of ctx.requirementHrefs) {
    const problem = linkProblem(href, ctx, pages)
    if (problem) report('registry', `a setup requirement: ${problem}`)
  }

  return issues
}
