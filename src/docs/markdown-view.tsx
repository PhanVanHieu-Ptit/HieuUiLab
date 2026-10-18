import { Hash, Info, Lightbulb, OctagonAlert, TriangleAlert } from 'lucide-react'
import { Fragment, useMemo, type ElementType, type ReactNode } from 'react'

import { CodeBlock, type CodeLanguage } from '@/components/site/code-block'
import { inlineCodeClass, proseLinkClass, tableWrapClass } from '@/components/site/prose'
import { ScrollRegion } from '@/components/site/scroll-region'
import { SmartLink } from '@/components/site/smart-link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/cn'

import { DirectiveProblem, DirectiveView } from './directive-view'
import { walkBlocks, type AlertKind, type Block, type Inline } from './markdown'

const codeLanguages: readonly CodeLanguage[] = ['tsx', 'ts', 'json', 'css', 'bash', 'text']

/** The language of a fence, or plain text for one the docs do not highlight. */
function codeLanguage(lang: string): CodeLanguage {
  return codeLanguages.find((language) => language === lang) ?? 'text'
}

function InlineView({ nodes }: { nodes: readonly Inline[] }) {
  return (
    <>
      {nodes.map((node, index) => (
        <Fragment key={index}>{inline(node)}</Fragment>
      ))}
    </>
  )
}

function inline(node: Inline): ReactNode {
  switch (node.type) {
    case 'text':
      return node.text
    case 'code':
      return <code className={inlineCodeClass}>{node.text}</code>
    case 'strong':
      return (
        <strong>
          <InlineView nodes={node.children} />
        </strong>
      )
    case 'em':
      return (
        <em>
          <InlineView nodes={node.children} />
        </em>
      )
    case 'del':
      return (
        <del>
          <InlineView nodes={node.children} />
        </del>
      )
    case 'br':
      return <br />
    case 'link':
      return node.href.startsWith('#') ? (
        <a href={node.href} className={proseLinkClass}>
          <InlineView nodes={node.children} />
        </a>
      ) : (
        <SmartLink href={node.href} className={proseLinkClass}>
          <InlineView nodes={node.children} />
        </SmartLink>
      )
    case 'unsupported':
      // Shown as the author wrote it, never interpreted; `validateDocs` reports it.
      return node.raw
  }
}

const alerts: Record<
  AlertKind,
  { title: string; variant: 'info' | 'success' | 'warning' | 'destructive'; Icon: ElementType }
> = {
  NOTE: { title: 'Note', variant: 'info', Icon: Info },
  TIP: { title: 'Tip', variant: 'success', Icon: Lightbulb },
  IMPORTANT: { title: 'Important', variant: 'warning', Icon: TriangleAlert },
  CAUTION: { title: 'Caution', variant: 'destructive', Icon: OctagonAlert },
}

// Headings are h2 to h4; the validator rejects others, and anything else renders as an h2 or h4.
const headings = {
  2: { Tag: 'h2', spacing: 'mt-6 first:mt-0', text: 'text-heading' },
  3: { Tag: 'h3', spacing: 'mt-3 first:mt-0', text: 'text-base font-semibold' },
  4: { Tag: 'h4', spacing: 'first:mt-0', text: 'text-sm font-semibold' },
} as const

function HeadingView({ block }: { block: Extract<Block, { type: 'heading' }> }) {
  const { Tag, spacing, text } = headings[block.depth >= 4 ? 4 : block.depth === 3 ? 3 : 2]
  return (
    <div className={cn('group flex items-center gap-1.5', spacing)}>
      <Tag id={block.id} className={text}>
        <InlineView nodes={block.children} />
      </Tag>
      <a
        href={`#${block.id}`}
        aria-label={`Link to section: ${block.text}`}
        className="inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground opacity-0 focus-ring transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
      >
        <Hash aria-hidden="true" className="size-4" />
      </a>
    </div>
  )
}

interface ViewContext {
  /** The accessible name of each code block's copy button. */
  copyLabels: WeakMap<Block, string>
}

function BlocksView({ blocks, context }: { blocks: readonly Block[]; context: ViewContext }) {
  return (
    <>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} context={context} />
      ))}
    </>
  )
}

function BlockView({ block, context }: { block: Block; context: ViewContext }) {
  switch (block.type) {
    case 'heading':
      return <HeadingView block={block} />
    case 'paragraph':
      return (
        <p className="max-w-prose leading-7 text-pretty">
          <InlineView nodes={block.children} />
        </p>
      )
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul'
      return (
        <List
          className={cn(
            // Items stay `display: list-item`: making them flex containers would drop the marker.
            'max-w-prose pl-6 leading-7 [&>li+li]:mt-2',
            block.ordered ? 'list-decimal' : 'list-disc',
          )}
          {...(block.ordered && block.start !== 1 ? { start: block.start } : {})}
        >
          {block.items.map((item, index) => (
            <li key={index} className="pl-1 marker:text-muted-foreground [&>*+*]:mt-2">
              <BlocksView blocks={item} context={context} />
            </li>
          ))}
        </List>
      )
    }
    case 'code':
      return (
        <CodeBlock
          code={block.text}
          language={codeLanguage(block.lang)}
          {...(block.attrs.title ? { title: block.attrs.title } : {})}
          copyLabel={context.copyLabels.get(block) ?? 'Copy code'}
        />
      )
    case 'table':
      return (
        <ScrollRegion label="Table, scrollable" className={tableWrapClass}>
          <Table>
            <TableCaption className="sr-only">Table</TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {block.header.map((cell, index) => (
                  <TableHead key={index} className={alignClass(block.align[index])}>
                    <InlineView nodes={cell} />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, index) => (
                    <TableCell
                      key={index}
                      className={cn('align-top', alignClass(block.align[index]))}
                    >
                      <InlineView nodes={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollRegion>
      )
    case 'alert': {
      const { title, variant, Icon } = alerts[block.kind]
      return (
        <Alert variant={variant} role="note" className="max-w-prose">
          <Icon aria-hidden="true" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 text-foreground">
            <BlocksView blocks={block.blocks} context={context} />
          </AlertDescription>
        </Alert>
      )
    }
    case 'quote':
      return (
        <blockquote className="flex max-w-prose flex-col gap-2 border-l-2 pl-4 text-muted-foreground">
          <BlocksView blocks={block.blocks} context={context} />
        </blockquote>
      )
    case 'rule':
      return <hr className="my-2" />
    case 'directive':
      return <DirectiveView directive={block.directive} />
    case 'invalid-directive':
      return <DirectiveProblem title="Cannot show this directive" message={block.error} />
    case 'unsupported':
      return (
        <DirectiveProblem
          title="Not supported in docs"
          message={`${block.reason}: ${block.raw.trim()}`}
        />
      )
  }
}

function alignClass(align: 'left' | 'center' | 'right' | null | undefined): string | undefined {
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return undefined
}

/** `Copy <title>` for each code block, so a page with several says what each button copies. */
function copyLabels(blocks: readonly Block[]): WeakMap<Block, string> {
  const labels = new WeakMap<Block, string>()
  const seen = new Map<string, number>()
  walkBlocks(blocks, (block) => {
    if (block.type !== 'code') return
    const title = block.attrs.title
    const base = title ? `Copy ${title}` : 'Copy code'
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    labels.set(block, count === 1 ? base : `${base} (${String(count)})`)
  })
  return labels
}

/** The body of a docs page: Markdown blocks rendered with the site's components. */
export function MarkdownView({ blocks }: { blocks: readonly Block[] }) {
  const context = useMemo<ViewContext>(() => ({ copyLabels: copyLabels(blocks) }), [blocks])
  return (
    <div className="flex flex-col gap-5">
      <BlocksView blocks={blocks} context={context} />
    </div>
  )
}
