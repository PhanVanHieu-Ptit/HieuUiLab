import type { Block, Inline, ParsedDoc } from './markdown'

// The rules every Markdown page on the site follows, whichever collection it belongs to: the docs
// (`docs-rules.ts`) and the engineering notes (`src/notes/notes-rules.ts`) share them, so the
// spelling list, the placeholder ban, and the code-fence policy cannot drift apart. Each function
// takes a `Report` that prefixes the collection and page id.

export type Report = (id: string, message: string) => void

/** Fence languages the site's Markdown uses. `bash` and `text` are shown without highlighting. */
export const fenceLanguages = ['tsx', 'ts', 'json', 'css', 'bash', 'text'] as const

export const ROOT_FILES = new Set([
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'index.html',
  'vite.config.ts',
  'vercel.json',
  'playwright.config.ts',
  'eslint.config.js',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'pnpm-lock.yaml',
])

/** An inline code span that is meant as a path in this repository. */
export const REPO_PATH =
  /^(?:(?:src|e2e|public|\.github)\/[\w./@-]*|[\w.-]+\.(?:json|md|html|ts|js|yaml))$/

const HTML_ENTITY = /&(?:#\d+|#x[\da-f]+|[a-z][a-z\d]*);/i

/** Words that promise what is not built. The site says what exists, and says what does not. */
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

export function excerpt(text: string): string {
  const flat = text.trim().replace(/\s+/g, ' ')
  return flat.length > 48 ? `${flat.slice(0, 48)}…` : flat
}

/**
 * The heading rules: the file's `# Title` is the expected title and the only h1, there is at least
 * one `##`, levels do not skip, and heading ids are unique and not `main`.
 */
export function validateHeadingStructure(
  id: string,
  expectedTitle: string,
  doc: ParsedDoc,
  report: Report,
): void {
  if (doc.title !== expectedTitle) {
    report(
      id,
      doc.title === undefined
        ? `the file must start with "# ${expectedTitle}"`
        : `the file starts with "# ${doc.title}" but the manifest title is "${expectedTitle}"`,
    )
  }
  if (doc.h1Count > 1) report(id, 'has more than one # heading; the first line is the only h1')

  const headings = doc.blocks.filter(
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

/**
 * Why a block cannot be shown as written: an unsupported construct, a malformed directive, or an
 * alert with no text. Undefined when the block is fine on these counts.
 */
export function blockShapeProblem(block: Block): string | undefined {
  if (block.type === 'unsupported') return `${block.reason}: "${excerpt(block.raw)}"`
  if (block.type === 'invalid-directive') return `${block.error}: "${excerpt(block.raw)}"`
  if (block.type === 'alert' && block.blocks.length === 0) return 'has an alert with no text'
  return undefined
}

/**
 * A fence's language, attributes, and title. Returns the label the other code-block messages use:
 * the title, or the language when there is none.
 */
export function validateFenceShape(
  block: Extract<Block, { type: 'code' }>,
  id: string,
  report: Report,
): string {
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
  return label
}

export function validateText(text: string, id: string, report: Report): void {
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

/** What an inline needs from its collection: whether a path exists, and whether a link leads anywhere. */
export interface InlineChecks {
  pathExists(path: string): boolean
  /** Why `href` does not lead anywhere real; undefined when it does. */
  linkProblem(href: string): string | undefined
}

/** The checks on one inline: unsupported constructs, links, repository paths in code, and prose. */
export function validateInline(
  inline: Inline,
  id: string,
  checks: InlineChecks,
  report: Report,
): void {
  if (inline.type === 'unsupported') {
    report(id, `${inline.reason}: "${excerpt(inline.raw)}"`)
  } else if (inline.type === 'link') {
    const problem = checks.linkProblem(inline.href)
    if (problem) report(id, problem)
  } else if (inline.type === 'code') {
    const text = inline.text
    if (REPO_PATH.test(text) && (text.includes('/') || ROOT_FILES.has(text))) {
      if (!checks.pathExists(text.replace(/\/$/, ''))) {
        report(id, `${text} does not exist in the repository`)
      }
    }
  } else if (inline.type === 'text') {
    validateText(inline.text, id, report)
  }
}

/** How a link is written, before anything is looked up. */
export type LinkShape =
  | { kind: 'external' }
  | { kind: 'invalid'; message: string }
  | { kind: 'fragment'; id: string }
  | { kind: 'path'; path: string; hash: string | undefined }

export function linkShape(href: string): LinkShape {
  if (href.startsWith('https://')) return { kind: 'external' }
  if (href.startsWith('http://')) return { kind: 'invalid', message: `link ${href} is not https` }
  if (href.startsWith('#')) return { kind: 'fragment', id: href.slice(1) }
  if (!href.startsWith('/')) {
    return {
      kind: 'invalid',
      message: `link "${href}" must be an https:// URL, a /path on this site, or a #heading`,
    }
  }
  const [beforeHash = '', hash] = href.split('#')
  return { kind: 'path', path: beforeHash.split('?')[0] ?? '', hash }
}
