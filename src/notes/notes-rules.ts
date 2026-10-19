import { findUnsupportedClaim, isSafeRepoPath } from '@/content/showcase-rules'
import {
  parseMarkdown,
  plainText,
  walkBlocks,
  walkInlines,
  type Block,
  type Inline,
} from '@/docs/markdown'
import {
  blockShapeProblem,
  excerpt,
  linkShape,
  validateFenceShape,
  validateHeadingStructure,
  validateInline,
  type Report,
} from '@/docs/markdown-rules'

import { noteFile, relatedNotes, isNoteTag, type NoteEntry } from './manifest'

// The rules every engineering note must follow, as a pure function over an injected context (the
// same shape as `validateDocs`). The rules that matter most are the ones that keep a note honest:
// every code block is a real excerpt of a repository file or says it is hypothetical, every claim
// names the file it rests on, and the Verification section says what it did not verify.
// `src/test/notes-context.ts` supplies the real answers; tests give it bad data to show each rule
// fires. Run it with `pnpm notes:check`, or as part of `pnpm test`.

export interface NotesContext {
  /** Every article with the Markdown its loader returns. */
  articles: readonly { entry: NoteEntry; source: string }[]
  /** The Markdown files in `src/notes/content/`. */
  contentFiles: readonly string[]
  /** The text of a file on disk, or undefined when there is none. */
  readFile(path: string): string | undefined
  fileExists(path: string): boolean
  /** True when the file exists and its text includes `text`. */
  fileContains(path: string, text: string): boolean
  /** True for a file or a directory. */
  pathExists(path: string): boolean
  /** True when the site links to or serves the path and the router resolves it to a page. */
  routeExists(path: string): boolean
  /** The scripts in package.json. */
  scripts: ReadonlySet<string>
}

/** The `##` sections of every note, in order. */
export const requiredSections = [
  'Context and problem',
  'Constraints',
  'Approach and alternatives considered',
  'Implementation example',
  'Verification',
  'Trade-offs and lessons learned',
] as const

/** Present if and only if the note links to an external source. */
export const referencesSection = 'References'

/** The `###` heading inside Verification where a note says what it did not check. */
export const notVerifiedHeading = 'What this does not verify'

/** A code block that is not an excerpt of a repository file must say so in its title. */
export const hypotheticalPrefix = 'Hypothetical example: '

/** A `bash` block of commands the repository defines. */
export const commandPrefix = 'Command: '

/** Ids the page itself adds after the article body. */
const RESERVED_IDS = ['related-articles', 'evidence']

const MIN_SECTION_WORDS = 30
const MIN_ARTICLE_WORDS = 600
const MIN_NOT_VERIFIED_WORDS = 10
const MAX_SUMMARY = 220

/**
 * Wording that claims a history the repository cannot show. A tripwire, not a proof: it catches the
 * obvious slips, and a false positive costs a rephrase. The real controls are the code-block rule,
 * the evidence list, and the required "what this does not verify" section.
 */
const FABRICATED_HISTORY =
  /\b(?:incidents?|outages?|post-?mortems?|on-call|(?:my|our) (?:team|employer|manager|boss)|at work|colleagues?|users? reported|(?:i|we) (?:fixed|solved|resolved|shipped|deployed|rolled out))\b/i

/** A line that stands for omitted code: `// …`, `/* … *\/`, `{/* … *\/}`, `# …`, `<!-- … -->`. */
const GAP_MARKER = /^(?:\/\/|#|\/\*|\{\/\*|<!--)\s*(?:…|\.\.\.)\s*(?:\*\/\}?|-->)?$/

function isCalendarDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    // Date.parse accepts 2026-02-30 and rolls it over, so compare the round trip too.
    new Date(value).toISOString().startsWith(value)
  )
}

/**
 * Whitespace, semicolons, and trailing commas carry no meaning an excerpt needs to keep, and
 * Prettier moves all three when it re-wraps a block or dedents it, or when it puts a leading `;`
 * on a statement that starts with `(`, `[`, or a backtick.
 */
function squash(text: string): string {
  return text
    .replace(/\s+/g, '')
    .replaceAll(';', '')
    .replace(/,(?=[)\]}])/g, '')
}

/**
 * Why `code` is not an excerpt of `file`; undefined when it is. A gap marker line splits the block
 * into parts; each part must occur in the file, in order, ignoring layout.
 */
export function excerptProblem(code: string, file: string): string | undefined {
  const parts: string[] = []
  let current: string[] = []
  for (const line of code.split('\n')) {
    if (GAP_MARKER.test(line.trim())) {
      parts.push(current.join('\n'))
      current = []
    } else {
      current.push(line)
    }
  }
  parts.push(current.join('\n'))

  const haystack = squash(file)
  let cursor = 0
  let checked = 0
  for (const part of parts) {
    const needle = squash(part)
    if (needle === '') continue
    checked += 1
    const at = haystack.indexOf(needle, cursor)
    if (at < 0) {
      return cursor === 0
        ? `"${excerpt(part)}" does not occur in the file`
        : `"${excerpt(part)}" does not occur in the file after the part before it`
    }
    cursor = at + needle.length
  }
  return checked === 0 ? 'has no code' : undefined
}

interface Section {
  /** The `##` heading text; empty for what comes before the first one. */
  title: string
  blocks: Block[]
}

function sectionsOf(blocks: readonly Block[]): Section[] {
  const sections: Section[] = [{ title: '', blocks: [] }]
  for (const block of blocks) {
    if (block.type === 'heading' && block.depth === 2) {
      sections.push({ title: block.text, blocks: [] })
    } else {
      sections.at(-1)?.blocks.push(block)
    }
  }
  return sections
}

function anyBlock(blocks: readonly Block[], test: (block: Block) => boolean): boolean {
  let found = false
  walkBlocks(blocks, (block) => {
    found ||= test(block)
  })
  return found
}

function anyInline(blocks: readonly Block[], test: (inline: Inline) => boolean): boolean {
  let found = false
  walkInlines(blocks, (inline) => {
    found ||= test(inline)
  })
  return found
}

/** Words of running text: paragraphs and tables, without headings and code. */
function wordCount(blocks: readonly Block[]): number {
  let words = 0
  walkBlocks(blocks, (block) => {
    const groups: readonly (readonly Inline[])[] =
      block.type === 'paragraph'
        ? [block.children]
        : block.type === 'table'
          ? [...block.header, ...block.rows.flat()]
          : []
    for (const group of groups) {
      words += plainText(group).split(/\s+/).filter(Boolean).length
    }
  })
  return words
}

function validateManifest(ctx: NotesContext, report: Report): void {
  const list = ctx.articles.map(({ entry }) => entry)
  const slugs = new Set<string>()
  const titles = new Set<string>()
  const files = new Set<string>()

  for (const { entry, source } of ctx.articles) {
    const id = entry.slug
    if (slugs.has(id)) report(id, 'the slug is used by another article')
    slugs.add(id)
    if (titles.has(entry.title)) report(id, `the title "${entry.title}" is used by another article`)
    titles.add(entry.title)

    if (!/^[a-z][a-z\d-]*$/.test(id)) report(id, 'the slug must be kebab-case')
    if (entry.title.trim() === '') report(id, 'the title is empty')
    if (!entry.summary.endsWith('.')) {
      report(id, 'the summary must be a sentence ending with a period')
    }
    if (entry.summary.length > MAX_SUMMARY) {
      report(id, `the summary is longer than ${String(MAX_SUMMARY)} characters; it is a card text`)
    }

    if (!isCalendarDate(entry.date))
      report(id, `the date "${entry.date}" is not a date like 2026-10-19`)
    if (entry.updated !== undefined) {
      if (!isCalendarDate(entry.updated)) {
        report(id, `the update date "${entry.updated}" is not a date like 2026-10-19`)
      } else if (entry.updated < entry.date) {
        report(id, `the update date ${entry.updated} is before the date ${entry.date}`)
      }
    }

    if (entry.tags.length < 1 || entry.tags.length > 4) {
      report(id, `has ${String(entry.tags.length)} tags; use one to four`)
    }
    const seenTags = new Set<string>()
    // The type already limits the tags; check the data anyway, since a cast can get past it.
    for (const tag of entry.tags as readonly string[]) {
      if (!isNoteTag(tag)) report(id, `the tag "${tag}" is not in the vocabulary in manifest.ts`)
      if (seenTags.has(tag)) report(id, `the tag "${tag}" is listed twice`)
      seenTags.add(tag)
    }

    const seenRelated = new Set<string>()
    for (const slug of entry.related ?? []) {
      if (slug === id) report(id, 'lists itself as related')
      else if (!list.some((other) => other.slug === slug)) {
        report(id, `lists "${slug}" as related, which is no article`)
      }
      if (seenRelated.has(slug)) report(id, `lists "${slug}" as related twice`)
      seenRelated.add(slug)
    }
    if (list.length > 1 && relatedNotes(id, 1, list).length === 0) {
      report(
        id,
        'has no related article; give it a tag in common with another article, or link one',
      )
    }

    if (entry.evidence.length < 1) report(id, 'names no evidence in the repository')
    const labels = new Set<string>()
    for (const ref of entry.evidence) {
      if (ref.label.trim() === '') report(id, 'has evidence with no label')
      if (labels.has(ref.label)) report(id, `has two pieces of evidence labelled "${ref.label}"`)
      labels.add(ref.label)
      if (!isSafeRepoPath(ref.path)) {
        report(id, `evidence "${ref.label}": "${ref.path}" is not a safe repository path`)
      } else if (!ctx.fileExists(ref.path)) {
        report(id, `evidence "${ref.label}": "${ref.path}" does not exist`)
      } else if (ref.anchor !== undefined && !ctx.fileContains(ref.path, ref.anchor)) {
        report(id, `evidence "${ref.label}": "${ref.path}" does not contain "${ref.anchor}"`)
      }
    }

    const file = noteFile(entry)
    files.add(file)
    const onDisk = ctx.readFile(file)
    if (onDisk === undefined) report(id, `its file ${file} does not exist`)
    else if (onDisk !== source) report(id, `its loader returns something other than ${file}`)

    for (const [field, text] of [
      ['title', entry.title],
      ['summary', entry.summary],
    ] as const) {
      const claim =
        findUnsupportedClaim(text) ?? (FABRICATED_HISTORY.test(text) ? 'a history' : undefined)
      if (claim) report(id, `the ${field} makes ${claim} the repository cannot show`)
    }
  }

  for (const file of ctx.contentFiles) {
    if (!files.has(file)) report('manifest', `${file} belongs to no article in the manifest`)
  }
}

/** Why a link in a note does not lead anywhere real; undefined when it does. */
function linkProblem(href: string, headingIds: ReadonlySet<string>, ctx: NotesContext) {
  const shape = linkShape(href)
  if (shape.kind === 'external') return undefined
  if (shape.kind === 'invalid') return shape.message
  if (shape.kind === 'fragment') {
    return headingIds.has(shape.id) ? undefined : `link ${href} points at no heading on this page`
  }
  if (!ctx.routeExists(shape.path)) return `link ${href} is not a page on this site`
  if (shape.hash) {
    return `link ${href} has a #heading that cannot be checked; link to the page instead`
  }
  return undefined
}

/** Why a `Command:` block runs something the repository does not define; one entry per problem. */
function commandProblems(text: string, ctx: NotesContext): string[] {
  const problems: string[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (line === '' || line.startsWith('#')) continue
    const [bin, sub] = line.split(/\s+/)
    if (bin !== 'pnpm') {
      problems.push(`runs "${line}", which is not a pnpm command`)
      continue
    }
    if (sub === undefined || !(ctx.scripts.has(sub) || ['exec', 'install', 'add'].includes(sub))) {
      problems.push(`runs "pnpm ${sub ?? ''}", which is no script in package.json`)
    }
    for (const token of line.split(/\s+/)) {
      if ((token.startsWith('src/') || token.startsWith('e2e/')) && !ctx.pathExists(token)) {
        problems.push(`names ${token}, which does not exist`)
      }
    }
  }
  return problems
}

function validateCodeBlock(
  block: Extract<Block, { type: 'code' }>,
  titles: Set<string>,
  ctx: NotesContext,
  id: string,
  report: Report,
): void {
  const label = validateFenceShape(block, id, report)
  const title = block.attrs.title
  if (!title) return

  // The copy button is named after the title, so two blocks with one title are one name.
  if (titles.has(title)) {
    report(id, `two code blocks are titled "${title}"; the copy button is named after the title`)
  }
  titles.add(title)

  if (title.startsWith(hypotheticalPrefix)) {
    if (title.slice(hypotheticalPrefix.length).trim() === '') {
      report(
        id,
        `code block "${label}" says what it is hypothetical about: "${hypotheticalPrefix}…"`,
      )
    }
    return
  }

  if (title.startsWith(commandPrefix)) {
    if (block.lang !== 'bash')
      report(id, `code block "${label}" is a command; use the bash language`)
    for (const problem of commandProblems(block.text, ctx)) {
      report(id, `code block "${label}" ${problem}`)
    }
    return
  }

  const [, path = '', note] = /^(\S+)(?: \((.+)\))?$/.exec(title) ?? []
  if (path === '' || (!path.includes('/') && !path.includes('.'))) {
    report(
      id,
      `code block "${label}" is neither a repository file nor labelled "${hypotheticalPrefix}…" or "${commandPrefix}…"`,
    )
    return
  }
  if (note?.trim() === '') {
    report(id, `code block "${label}" has an empty note after the path`)
  }
  const file = isSafeRepoPath(path) ? ctx.readFile(path) : undefined
  if (file === undefined) {
    report(
      id,
      `code block "${label}" names ${path}, which is no repository file; label invented code "${hypotheticalPrefix}…"`,
    )
    return
  }
  const problem = excerptProblem(block.text, file)
  if (problem) {
    report(
      id,
      `code block "${label}" is not an excerpt of ${path}: ${problem}; copy it from the file, or label it "${hypotheticalPrefix}…"`,
    )
  }
}

function validateArticle(
  { entry, source }: { entry: NoteEntry; source: string },
  ctx: NotesContext,
  report: Report,
): void {
  const id = entry.slug
  const doc = parseMarkdown(source)
  const headingIds = new Set(doc.headings.map((heading) => heading.id))
  const sections = sectionsOf(doc.blocks)

  validateHeadingStructure(id, entry.title, doc, report)

  // The template: these ## sections in this order, plus References when there is something to cite.
  const externalLinks: { href: string; section: string }[] = []
  for (const section of sections) {
    walkInlines(section.blocks, (inline) => {
      if (inline.type === 'link' && inline.href.startsWith('https://')) {
        externalLinks.push({ href: inline.href, section: section.title })
      }
    })
  }
  const expected: string[] = [...requiredSections]
  if (externalLinks.length > 0) expected.push(referencesSection)
  const actual = doc.headings
    .filter((heading) => heading.depth === 2)
    .map((heading) => heading.text)

  for (const name of expected) {
    if (actual.includes(name)) continue
    report(
      id,
      name === referencesSection
        ? 'links to an external source but has no "## References" section'
        : `is missing the "## ${name}" section`,
    )
  }
  for (const name of actual) {
    if (expected.includes(name)) continue
    report(
      id,
      name === referencesSection
        ? 'has a "## References" section but links to no external source'
        : `has the section "## ${name}", which is not in the template; the sections are ${expected.join(', ')}`,
    )
  }
  const complete = expected.every((name) => actual.includes(name))
  if (complete && actual.length === expected.length && actual.join('|') !== expected.join('|')) {
    report(id, `has its ## sections out of order; the order is ${expected.join(', ')}`)
  }

  // Every external source is listed under References.
  const referenced = new Set(
    externalLinks.filter((link) => link.section === referencesSection).map((link) => link.href),
  )
  for (const link of externalLinks) {
    if (!referenced.has(link.href)) {
      report(id, `links to ${link.href}, which is not listed under "## References"`)
    }
  }
  if (actual.includes(referencesSection) && referenced.size === 0 && externalLinks.length > 0) {
    report(id, 'has a "## References" section that lists no link')
  }

  // Headings: unique text, and no id the page adds itself.
  const headingTexts = new Set<string>()
  for (const heading of doc.headings) {
    if (headingTexts.has(heading.text)) {
      report(
        id,
        `two headings are called "${heading.text}"; give each its own text so anchors stay stable`,
      )
    }
    headingTexts.add(heading.text)
    if (RESERVED_IDS.includes(heading.id)) {
      report(id, `heading "${heading.text}" would take the id "${heading.id}", which the page uses`)
    }
  }

  // Enough to be an article and not a stub.
  const total = sections.reduce((sum, section) => sum + wordCount(section.blocks), 0)
  if (total < MIN_ARTICLE_WORDS) {
    report(
      id,
      `has ${String(total)} words outside code; an article has at least ${String(MIN_ARTICLE_WORDS)}`,
    )
  }
  for (const section of sections) {
    if (!(requiredSections as readonly string[]).includes(section.title)) continue
    const words = wordCount(section.blocks)
    if (words < MIN_SECTION_WORDS) {
      report(
        id,
        `"## ${section.title}" has ${String(words)} words; say what it needs to say, at least ${String(MIN_SECTION_WORDS)}`,
      )
    }
  }

  const implementation = sections.find((section) => section.title === 'Implementation example')
  if (implementation && !anyBlock(implementation.blocks, (block) => block.type === 'code')) {
    report(id, '"## Implementation example" has no code block')
  }

  validateVerification(id, sections, ctx, report)

  // Blocks, code, and prose.
  const titles = new Set<string>()
  walkBlocks(doc.blocks, (block) => {
    const problem = blockShapeProblem(block)
    if (problem) report(id, problem)
    else if (block.type === 'directive') {
      report(id, `uses ::${block.directive.name}; directives belong in the docs`)
    } else if (block.type === 'code') validateCodeBlock(block, titles, ctx, id, report)
  })

  const checks = {
    pathExists: (path: string) => ctx.pathExists(path),
    linkProblem: (href: string) => linkProblem(href, headingIds, ctx),
  }
  walkInlines(doc.blocks, (inline) => {
    validateInline(inline, id, checks, report)
    if (inline.type !== 'text') return
    const claim = findUnsupportedClaim(inline.text)
    if (claim)
      report(
        id,
        `makes ${claim}: "${excerpt(inline.text)}"; a note says only what the repository shows`,
      )
    const history = FABRICATED_HISTORY.exec(inline.text)
    if (history) {
      report(id, `says "${history[0]}"; a note describes the code, not a history it cannot show`)
    }
  })
}

/** Verification names what was run and, in its own subsection, what was not. */
function validateVerification(
  id: string,
  sections: readonly Section[],
  ctx: NotesContext,
  report: Report,
): void {
  const verification = sections.find((section) => section.title === 'Verification')
  if (!verification) return

  const start = verification.blocks.findIndex(
    (block) => block.type === 'heading' && block.depth === 3 && block.text === notVerifiedHeading,
  )
  if (start < 0) {
    report(id, `"## Verification" has no "### ${notVerifiedHeading}" subsection`)
  } else {
    const rest = verification.blocks.slice(start + 1)
    const end = rest.findIndex((block) => block.type === 'heading' && block.depth <= 3)
    const body = end < 0 ? rest : rest.slice(0, end)
    if (wordCount(body) < MIN_NOT_VERIFIED_WORDS) {
      report(id, `"### ${notVerifiedHeading}" is empty or too short; say what was not checked`)
    }
  }

  const ranSomething =
    anyBlock(
      verification.blocks,
      (block) => block.type === 'code' && block.attrs.title?.startsWith(commandPrefix) === true,
    ) ||
    anyInline(
      verification.blocks,
      (inline) =>
        inline.type === 'code' && inline.text.includes('/') && ctx.pathExists(inline.text),
    )
  if (!ranSomething) {
    report(
      id,
      '"## Verification" names no command and no repository path; say what was run or read',
    )
  }
}

/** Every problem in the engineering notes, as `notes/<slug>: message`. Empty when they are sound. */
export function validateNotes(ctx: NotesContext): string[] {
  const issues: string[] = []
  const report: Report = (id, message) => issues.push(`notes/${id}: ${message}`)

  validateManifest(ctx, report)
  for (const article of ctx.articles) validateArticle(article, ctx, report)

  return issues
}
