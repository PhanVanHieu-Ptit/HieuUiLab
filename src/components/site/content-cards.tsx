import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardTitle,
} from '@/components/ui/card'
import { experimentKindLabel } from '@/content/experiments'
import type { Experiment, Note, Project } from '@/content/types'
import { formatDate } from '@/lib/format-date'

import { StatusBadge } from './status-badge'

type HeadingLevel = 'h2' | 'h3'

export function NoteCard({
  note,
  headingLevel = 'h3',
}: {
  note: Note
  headingLevel?: HeadingLevel
}) {
  return (
    <Card variant="interactive" className="flex-1">
      <CardHeader>
        <time dateTime={note.date} className="font-mono text-xs text-muted-foreground">
          {formatDate(note.date)}
        </time>
        <CardTitle as={headingLevel}>
          <CardLink asChild>
            <Link to={`/notes/${note.slug}`}>{note.title}</Link>
          </CardLink>
        </CardTitle>
        <CardDescription className="line-clamp-3">{note.summary}</CardDescription>
      </CardHeader>
      <CardFooter className="flex-wrap">
        {note.tags.map((tag) => (
          <Badge key={tag} size="sm" variant="outline">
            {tag}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  )
}

export function ProjectCard({
  project,
  headingLevel = 'h3',
}: {
  project: Project
  headingLevel?: HeadingLevel
}) {
  return (
    <Card variant="interactive" className="flex-1">
      <CardHeader>
        <p className="font-mono text-xs text-muted-foreground">
          {project.role} · {project.period}
        </p>
        <CardTitle as={headingLevel} className="text-lg">
          <CardLink asChild>
            <Link to={`/projects/${project.slug}`}>{project.title}</Link>
          </CardLink>
        </CardTitle>
        <CardDescription>{project.summary}</CardDescription>
      </CardHeader>
      <CardFooter className="flex-wrap">
        {project.stack.map((item) => (
          <Badge key={item} size="sm">
            {item}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  )
}

export function ExperimentCard({
  experiment,
  preview,
  headingLevel = 'h3',
}: {
  experiment: Experiment
  /** Real output from the experiment's code, not a mock-up. */
  preview?: ReactNode
  headingLevel?: HeadingLevel
}) {
  return (
    <Card variant="interactive" className="flex-1 overflow-hidden">
      {preview ? (
        <div className="flex items-center justify-center border-b bg-muted/30 p-6">{preview}</div>
      ) : null}
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge size="sm" variant="primary">
            {experimentKindLabel[experiment.kind]}
          </Badge>
          <StatusBadge status={experiment.status} size="sm" />
        </div>
        <CardTitle as={headingLevel}>
          <CardLink asChild>
            <Link to={`/lab/${experiment.slug}`}>{experiment.title}</Link>
          </CardLink>
        </CardTitle>
        <CardDescription>{experiment.summary}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-muted-foreground marker:text-border">
          {experiment.capabilities.map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
