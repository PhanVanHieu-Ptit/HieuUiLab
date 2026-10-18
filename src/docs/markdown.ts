import { Marked, type Token, type Tokens } from 'marked'

import { slugifyHeading } from '@/lib/slugify'

import { parseAttrs, type Attrs } from './attributes'
import { directiveShapeError, parseDirective, type Directive } from './directives'

// Markdown is lexed by `marked` and then normalised into the small tree below. Rendering and
// validation both work from this tree, so neither depends on marked's token shapes, and nothing
// is turned into an HTML string: raw HTML, images, and other constructs the docs do not use stay
// in the tree as `unsupported` nodes (rendered as plain text, rejected by `validateDocs`).

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string }
  | { type: 'strong' | 'em' | 'del'; children: Inline[] }
  | { type: 'link'; href: string; children: Inline[] }
  | { type: 'br' }
  | { type: 'unsupported'; raw: string; reason: string }

export const alertKinds = ['NOTE', 'TIP', 'IMPORTANT', 'CAUTION'] as const
export type AlertKind = (typeof alertKinds)[number]

export type Align = 'left' | 'center' | 'right' | null

export type Block =
  | {
      type: 'heading'
      depth: number
      /** The anchor id: written as `{#id}` after the text, else derived from the text. */
      id: string
      explicitId: string | undefined
      text: string
      children: Inline[]
    }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; start: number; items: Block[][] }
  | {
      type: 'code'
      /** First word of the info string; '' for a fence without one. */
      lang: string
      attrs: Attrs
      /** Set when the rest of the info string is not valid `key="value"` pairs. */
      error: string | undefined
      text: string
    }
  | { type: 'table'; align: Align[]; header: Inline[][]; rows: Inline[][][] }
  | { type: 'alert'; kind: AlertKind; blocks: Block[] }
  | { type: 'quote'; blocks: Block[] }
  | { type: 'rule' }
  | { type: 'directive'; directive: Directive }
  | { type: 'invalid-directive'; raw: string; error: string }
  | { type: 'unsupported'; raw: string; reason: string }

export interface DocHeading {
  depth: number
  id: string
  text: string
}

export interface ParsedDoc {
  /** The text of the leading `# Title`, which is not part of `blocks`. */
  title: string | undefined
  /** How many `#` headings the file has, the title included. */
  h1Count: number
  blocks: Block[]
  /** The `##` and deeper headings at the top level, in order, for the table of contents. */
  headings: DocHeading[]
}

const markdown = new Marked({ gfm: true })

const EXPLICIT_ID = /\s*\{#([a-z][a-z0-9-]*)\}\s*$/
const ALERT_MARKER = /^\[!([A-Za-z]+)\][ \t]*\n?/

function inlines(tokens: readonly Token[] | undefined): Inline[] {
  const out: Inline[] = []
  for (const token of tokens ?? []) {
    switch (token.type) {
      case 'text':
      case 'escape':
        out.push({ type: 'text', text: (token as Tokens.Text | Tokens.Escape).text })
        break
      case 'codespan':
        out.push({ type: 'code', text: (token as Tokens.Codespan).text })
        break
      case 'strong':
      case 'em':
      case 'del':
        out.push({
          type: token.type,
          children: inlines((token as Tokens.Strong | Tokens.Em | Tokens.Del).tokens),
        })
        break
      case 'link': {
        const link = token as Tokens.Link
        out.push({ type: 'link', href: link.href, children: inlines(link.tokens) })
        break
      }
      case 'br':
        out.push({ type: 'br' })
        break
      case 'image':
        out.push({ type: 'unsupported', raw: token.raw, reason: 'images are not supported' })
        break
      case 'html':
        out.push({ type: 'unsupported', raw: token.raw, reason: 'raw HTML is not supported' })
        break
      default:
        out.push({
          type: 'unsupported',
          raw: token.raw,
          reason: `"${token.type}" is not supported`,
        })
    }
  }
  return out
}

/** Plain text of inline content, as a heading or a table of contents entry shows it. */
export function plainText(children: readonly Inline[]): string {
  return children
    .map((child) => {
      switch (child.type) {
        case 'text':
        case 'code':
          return child.text
        case 'strong':
        case 'em':
        case 'del':
        case 'link':
          return plainText(child.children)
        case 'br':
          return ' '
        case 'unsupported':
          return ''
      }
    })
    .join('')
}

function takeExplicitId(children: Inline[]): { children: Inline[]; id: string | undefined } {
  const last = children.at(-1)
  if (last?.type !== 'text') return { children, id: undefined }
  const match = EXPLICIT_ID.exec(last.text)
  if (match === null) return { children, id: undefined }
  const text = last.text.slice(0, match.index)
  const rest = children.slice(0, -1)
  return { children: text === '' ? rest : [...rest, { type: 'text', text }], id: match[1] }
}

function fence(token: Tokens.Code): Block {
  if (token.codeBlockStyle === 'indented') {
    return {
      type: 'unsupported',
      raw: token.raw,
      reason: 'indented code blocks are not supported; use a fenced block with a language',
    }
  }
  const info = (token.lang ?? '').trim()
  const space = info.search(/\s/)
  const lang = space === -1 ? info : info.slice(0, space)
  const parsed = parseAttrs(space === -1 ? '' : info.slice(space))
  return {
    type: 'code',
    lang,
    attrs: 'attrs' in parsed ? parsed.attrs : {},
    error: 'error' in parsed ? parsed.error : undefined,
    text: token.text,
  }
}

function directive(raw: string, nested: boolean): Block {
  if (nested) {
    return {
      type: 'invalid-directive',
      raw,
      error: 'directives are only allowed at the top level of a page',
    }
  }
  const parsed = parseDirective(raw)
  if ('error' in parsed) return { type: 'invalid-directive', raw, error: parsed.error }
  const error = directiveShapeError(parsed.directive)
  if (error !== undefined) return { type: 'invalid-directive', raw, error }
  return { type: 'directive', directive: parsed.directive }
}

/** A blockquote that opens with `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, or `[!CAUTION]` is an alert. */
function quote(token: Tokens.Blockquote): Block {
  const first = token.tokens[0]
  if (first?.type === 'paragraph') {
    const paragraph = first as Tokens.Paragraph
    const lead = paragraph.tokens[0]
    const marker = lead?.type === 'text' ? ALERT_MARKER.exec((lead as Tokens.Text).text) : null
    if (lead !== undefined && marker !== null) {
      const kind = marker[1] ?? ''
      if (!(alertKinds as readonly string[]).includes(kind)) {
        return {
          type: 'unsupported',
          raw: token.raw,
          reason: `[!${kind}] is not a supported alert; use ${alertKinds.join(', ')}`,
        }
      }
      const text = (lead as Tokens.Text).text.slice(marker[0].length)
      const tokens: Token[] = [
        ...(text === '' ? [] : [{ ...(lead as Tokens.Text), text }]),
        ...paragraph.tokens.slice(1),
      ]
      const rest: Token[] = tokens.length > 0 ? [{ ...paragraph, tokens }] : []
      return {
        type: 'alert',
        kind: kind as AlertKind,
        blocks: blocks([...rest, ...token.tokens.slice(1)], true),
      }
    }
  }
  return { type: 'quote', blocks: blocks(token.tokens, true) }
}

function blocks(tokens: readonly Token[], nested: boolean): Block[] {
  const out: Block[] = []
  for (const token of tokens) {
    switch (token.type) {
      case 'space':
        break
      case 'heading': {
        const heading = token as Tokens.Heading
        if (nested) {
          out.push({
            type: 'unsupported',
            raw: token.raw,
            reason: 'headings are only allowed at the top level of a page',
          })
          break
        }
        const { children, id } = takeExplicitId(inlines(heading.tokens))
        out.push({
          type: 'heading',
          depth: heading.depth,
          id: '',
          explicitId: id,
          text: plainText(children),
          children,
        })
        break
      }
      case 'paragraph':
      case 'text': {
        const paragraph = token as Tokens.Paragraph | Tokens.Text
        // A line starting with `::` anywhere in a paragraph is meant as a directive, so a
        // directive run into other text is reported instead of silently shown as prose.
        if (/^::/m.test(paragraph.raw)) {
          out.push(directive(paragraph.raw, nested))
        } else {
          out.push({
            type: 'paragraph',
            children: paragraph.tokens
              ? inlines(paragraph.tokens)
              : [{ type: 'text', text: paragraph.text }],
          })
        }
        break
      }
      case 'code':
        out.push(fence(token as Tokens.Code))
        break
      case 'list': {
        const list = token as Tokens.List
        out.push({
          type: 'list',
          ordered: list.ordered,
          start: typeof list.start === 'number' ? list.start : 1,
          items: list.items.map((item) => blocks(item.tokens, true)),
        })
        break
      }
      case 'table': {
        const table = token as Tokens.Table
        out.push({
          type: 'table',
          align: table.align,
          header: table.header.map((cell) => inlines(cell.tokens)),
          rows: table.rows.map((row) => row.map((cell) => inlines(cell.tokens))),
        })
        break
      }
      case 'blockquote':
        out.push(quote(token as Tokens.Blockquote))
        break
      case 'hr':
        out.push({ type: 'rule' })
        break
      case 'html':
        out.push({ type: 'unsupported', raw: token.raw, reason: 'raw HTML is not supported' })
        break
      case 'checkbox':
        out.push({ type: 'unsupported', raw: token.raw, reason: 'task lists are not supported' })
        break
      default:
        out.push({
          type: 'unsupported',
          raw: token.raw,
          reason: `"${token.type}" is not supported`,
        })
    }
  }
  return out
}

/**
 * Gives every top-level heading its anchor id. Ids written as `{#id}` are claimed first, so an
 * automatic id never takes one; automatic ids repeat as `id`, `id-1`, `id-2`.
 */
function assignIds(top: Block[]): Block[] {
  const used = new Set<string>()
  for (const block of top) {
    if (block.type === 'heading' && block.explicitId !== undefined) used.add(block.explicitId)
  }
  return top.map((block) => {
    if (block.type !== 'heading') return block
    if (block.explicitId !== undefined) return { ...block, id: block.explicitId }
    const base = slugifyHeading(block.text) || 'section'
    let id = base
    for (let n = 1; used.has(id); n++) id = `${base}-${String(n)}`
    used.add(id)
    return { ...block, id }
  })
}

export function parseMarkdown(source: string): ParsedDoc {
  const parsed = blocks(markdown.lexer(source), false)
  const first = parsed[0]
  const hasTitle = first?.type === 'heading' && first.depth === 1
  const body = assignIds(hasTitle ? parsed.slice(1) : parsed)
  return {
    title: hasTitle ? first.text : undefined,
    h1Count: parsed.filter((block) => block.type === 'heading' && block.depth === 1).length,
    blocks: body,
    headings: body.flatMap((block) =>
      block.type === 'heading' && block.depth >= 2
        ? [{ depth: block.depth, id: block.id, text: block.text }]
        : [],
    ),
  }
}

/** Every block, nested ones (list items, quotes, alerts) included, in document order. */
export function walkBlocks(top: readonly Block[], visit: (block: Block) => void): void {
  for (const block of top) {
    visit(block)
    if (block.type === 'list') for (const item of block.items) walkBlocks(item, visit)
    if (block.type === 'alert' || block.type === 'quote') walkBlocks(block.blocks, visit)
  }
}

function inlineGroups(block: Block): Inline[][] {
  switch (block.type) {
    case 'heading':
    case 'paragraph':
      return [block.children]
    case 'table':
      return [...block.header, ...block.rows.flat()]
    default:
      return []
  }
}

/** Every inline node in the document, nested ones (inside emphasis or links) included. */
export function walkInlines(top: readonly Block[], visit: (inline: Inline) => void): void {
  const visitAll = (nodes: readonly Inline[]) => {
    for (const node of nodes) {
      visit(node)
      if (
        node.type === 'strong' ||
        node.type === 'em' ||
        node.type === 'del' ||
        node.type === 'link'
      ) {
        visitAll(node.children)
      }
    }
  }
  walkBlocks(top, (block) => {
    for (const group of inlineGroups(block)) visitAll(group)
  })
}
