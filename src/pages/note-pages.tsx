import { NotebookPen, SearchX } from 'lucide-react'
import { useId, useMemo } from 'react'
import { Link, useLoaderData, useSearchParams } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { NoteCard } from '@/components/site/content-cards'
import { NoteTagFilter } from '@/components/site/note-tag-filter'
import { PageContainer, PageHeader, SectionHeader } from '@/components/site/page'
import { inlineCodeClass } from '@/components/site/prose'
import { Button } from '@/components/ui/button'
import { badgeVariants } from '@/components/ui/badge'
import { sections } from '@/config/site'
import { parseMarkdown } from '@/docs/markdown'
import { MarkdownView } from '@/docs/markdown-view'
import { Toc } from '@/docs/toc'
import { formatDate } from '@/lib/format-date'
import {
  filterNotes,
  isNoteTag,
  noteFile,
  noteTagCounts,
  notes,
  relatedNotes,
  type NoteTag,
} from '@/notes/manifest'
import type { NoteLoaderData } from '@/router/loaders'

/** The tag a note list is filtered by, from `?tag=`. A tag that is not in the vocabulary is ignored. */
function useActiveTag(): [NoteTag | undefined, (tag: NoteTag | undefined) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('tag')
  const active = requested !== null && isNoteTag(requested) ? requested : undefined

  function select(tag: NoteTag | undefined) {
    // Each filter change is a history entry, so Back undoes it; the page keeps its scroll position.
    setSearchParams(tag ? { tag } : {}, { preventScrollReset: true })
  }

  return [active, select]
}

export function NotesIndexPage() {
  const [active, select] = useActiveTag()
  const results = filterNotes(active)
  const resultsId = useId()

  return (
    <PageContainer className="flex flex-col gap-8 pt-6 pb-section">
      <PageHeader
        eyebrow={sections.notes.title}
        title={sections.notes.heading}
        description={sections.notes.description}
      />
      {notes.length === 0 ? (
        <EmptyState
          icon={<NotebookPen />}
          headingLevel="h2"
          title="No articles yet"
          description="Articles are added as the lab grows."
        />
      ) : (
        <>
          <NoteTagFilter
            tags={noteTagCounts()}
            active={active}
            onChange={select}
            resultCount={results.length}
            total={notes.length}
            resultsId={resultsId}
          />
          {results.length === 0 ? (
            <EmptyState
              icon={<SearchX />}
              headingLevel="h2"
              title="No articles with this tag"
              description="No article carries the selected tag yet."
              actions={
                <Button
                  variant="outline"
                  onClick={() => {
                    select(undefined)
                  }}
                >
                  Show all articles
                </Button>
              }
            />
          ) : (
            <ul id={resultsId} aria-label="Articles" className="grid gap-4 md:grid-cols-2">
              {results.map((note) => (
                <li key={note.slug} className="flex">
                  <NoteCard note={note} headingLevel="h2" />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </PageContainer>
  )
}

export function NoteDetailPage() {
  const { entry, source } = useLoaderData<NoteLoaderData>()
  const doc = useMemo(() => parseMarkdown(source), [source])
  const related = relatedNotes(entry.slug)

  return (
    <PageContainer className="pt-6 pb-section">
      <article className="flex flex-col gap-12">
        <PageHeader
          eyebrow={
            <>
              <time dateTime={entry.date}>{formatDate(entry.date)}</time>
              {entry.updated ? (
                <>
                  {' · Updated '}
                  <time dateTime={entry.updated}>{formatDate(entry.updated)}</time>
                </>
              ) : null}
            </>
          }
          title={entry.title}
          description={entry.summary}
          actions={
            <ul aria-label="Tags" className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    to={{ pathname: '/notes', search: `?tag=${tag}` }}
                    aria-label={`Articles tagged ${tag}`}
                    className={`${badgeVariants({ variant: 'outline' })} rounded-full focus-ring hover:bg-accent`}
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          }
        />
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_13rem] xl:items-start xl:gap-12">
          {/* First in the document, so it reads before the text; wide screens move it to the right. */}
          <Toc headings={doc.headings} className="xl:col-start-2 xl:row-start-1" />
          <div className="min-w-0 xl:col-start-1 xl:row-start-1">
            <MarkdownView blocks={doc.blocks} />
          </div>
        </div>
        <section aria-labelledby="evidence" className="flex flex-col gap-4">
          <SectionHeader
            id="evidence"
            title="Evidence in the repository"
            description="The files this article’s claims rest on. Tests confirm that each file exists and contains the text named here; they do not prove the claims."
            anchorLabel="Evidence in the repository"
          />
          <ul className="flex flex-col gap-2 text-sm">
            {entry.evidence.map((item) => (
              <li key={item.label} className="flex flex-col gap-0.5">
                <span>{item.label}</span>
                <code className={`${inlineCodeClass} w-fit max-w-full break-all`}>{item.path}</code>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Source of this article: <code className={inlineCodeClass}>{noteFile(entry)}</code>
          </p>
        </section>
        {related.length > 0 ? (
          <section aria-labelledby="related-articles" className="flex flex-col gap-4">
            <SectionHeader
              id="related-articles"
              title="Related articles"
              anchorLabel="Related articles"
            />
            <ul className="grid gap-4 md:grid-cols-2">
              {related.map((note) => (
                <li key={note.slug} className="flex">
                  <NoteCard note={note} headingLevel="h3" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </PageContainer>
  )
}
