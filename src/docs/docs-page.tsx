import { useMemo } from 'react'

import { PageHeader } from '@/components/site/page'
import { inlineCodeClass } from '@/components/site/prose'

import { docFile, docNeighbours, type DocNode } from './manifest'
import { parseMarkdown } from './markdown'
import { MarkdownView } from './markdown-view'
import { Pager } from './pager'
import { Toc } from './toc'

interface DocsPageProps {
  node: DocNode
  /** The page's Markdown text. */
  source: string
}

/** A docs page: header, body, table of contents, and previous/next links. */
export function DocsPage({ node, source }: DocsPageProps) {
  const doc = useMemo(() => parseMarkdown(source), [source])
  const { previous, next } = docNeighbours(node)
  return (
    <article className="flex flex-col gap-10">
      <PageHeader
        eyebrow={node.group.title}
        title={node.entry.title}
        description={node.entry.description}
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_13rem] xl:items-start xl:gap-12">
        {/* First in the document, so it reads before the text; wide screens move it to the right. */}
        <Toc headings={doc.headings} className="xl:col-start-2 xl:row-start-1" />
        <div className="min-w-0 xl:col-start-1 xl:row-start-1">
          <MarkdownView blocks={doc.blocks} />
        </div>
      </div>
      <Pager {...(previous ? { previous } : {})} {...(next ? { next } : {})} />
      <p className="text-xs text-muted-foreground">
        Source: <code className={inlineCodeClass}>{docFile(node.entry)}</code>
      </p>
    </article>
  )
}
