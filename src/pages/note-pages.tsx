import { NotebookPen } from 'lucide-react'
import { useLoaderData } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { ContentSections } from '@/components/site/content-article'
import { NoteCard } from '@/components/site/content-cards'
import { PageContainer, PageHeader } from '@/components/site/page'
import { Badge } from '@/components/ui/badge'
import { sections } from '@/config/site'
import { notes } from '@/content/notes'
import type { Note } from '@/content/types'
import { formatDate } from '@/lib/format-date'

export function NotesIndexPage() {
  return (
    <PageContainer className="flex flex-col gap-10 pt-6 pb-section">
      <PageHeader
        eyebrow={sections.notes.title}
        title={sections.notes.heading}
        description={sections.notes.description}
      />
      {notes.length === 0 ? (
        <EmptyState
          icon={<NotebookPen />}
          headingLevel="h2"
          title="No notes yet"
          description="Notes are added as the lab grows."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <li key={note.slug} className="flex">
              <NoteCard note={note} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}

export function NoteDetailPage() {
  const note = useLoaderData<Note>()

  return (
    <PageContainer className="pt-6 pb-section">
      <article className="flex flex-col gap-12">
        <PageHeader
          eyebrow={<time dateTime={note.date}>{formatDate(note.date)}</time>}
          title={note.title}
          description={note.summary}
          actions={note.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        />
        <ContentSections sections={note.body} />
      </article>
    </PageContainer>
  )
}
