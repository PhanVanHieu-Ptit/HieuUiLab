import { NotebookPen } from 'lucide-react'
import { useParams } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { ContentSections } from '@/components/site/content-article'
import { NoteCard } from '@/components/site/content-cards'
import { CrumbTrail } from '@/components/site/crumb-trail'
import { PageContainer, PageHeader } from '@/components/site/page'
import { Badge } from '@/components/ui/badge'
import { getNote, notes } from '@/content/notes'
import { formatDate } from '@/lib/format-date'

import { NotFoundContent } from './not-found-page'

export function NotesIndexPage() {
  return (
    <PageContainer className="flex flex-col gap-10 py-section">
      <PageHeader
        eyebrow="Notes"
        title="Technical notes"
        description="Short write-ups of decisions made while building the lab: the problem, the approach, and its limits."
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
  const { slug = '' } = useParams()
  const note = getNote(slug)
  if (!note) {
    return (
      <PageContainer>
        <NotFoundContent />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="py-section">
      <CrumbTrail
        crumbs={[{ title: 'Notes', href: '/notes' }, { title: note.title }]}
        className="mb-6"
      />
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
