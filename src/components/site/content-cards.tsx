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
import { experimentHref, experimentKinds } from '@/content/experiments'
import {
  showcaseCategoryLabels,
  visibilityLabel,
  type ShowcaseProject,
} from '@/content/showcase-types'
import { templateBlocks, templateHref, type Template } from '@/content/templates'
import type { Experiment, Note, Project } from '@/content/types'
import { formatDate } from '@/lib/format-date'
import { getRegistryEntry } from '@/registry'

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
            {experimentKinds[experiment.kind].label}
          </Badge>
          <StatusBadge status={experiment.status} size="sm" />
        </div>
        <CardTitle as={headingLevel}>
          <CardLink asChild>
            <Link to={experimentHref(experiment)}>{experiment.title}</Link>
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

/** An example app: its views, and the blocks it is composed from. */
export function TemplateCard({
  template,
  headingLevel = 'h3',
}: {
  template: Template
  headingLevel?: HeadingLevel
}) {
  return (
    <Card variant="interactive" className="flex-1">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge size="sm" variant="primary">
            Template
          </Badge>
          <StatusBadge status={template.status} size="sm" />
        </div>
        <CardTitle as={headingLevel}>
          <CardLink asChild>
            <Link to={templateHref(template)}>{template.title}</Link>
          </CardLink>
        </CardTitle>
        <CardDescription>{template.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Views</p>
          <ul aria-label={`${template.title} views`} className="flex flex-wrap gap-1.5">
            {template.views.map((view) => (
              <li key={view.label}>
                <Badge size="sm" variant="outline">
                  {view.label}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Built from</p>
          <ul aria-label={`${template.title} blocks`} className="flex flex-wrap gap-1.5">
            {templateBlocks(template).map((slug) => (
              <li key={slug}>
                <Badge size="sm">{getRegistryEntry(slug, 'block')?.name ?? slug}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * A public project. Only the title is a link, and the card says what kind of project it is and
 * that it is public.
 */
export function ShowcaseProjectCard({
  project,
  headingLevel = 'h3',
}: {
  project: ShowcaseProject
  headingLevel?: HeadingLevel
}) {
  return (
    <Card variant="interactive" className="flex-1">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" variant="primary">
            {showcaseCategoryLabels[project.category]}
          </Badge>
          <Badge size="sm" variant="outline">
            {visibilityLabel[project.visibility]}
          </Badge>
        </div>
        <CardTitle as={headingLevel} className="text-lg">
          <CardLink asChild>
            <Link to={`/projects/${project.slug}`}>{project.title}</Link>
          </CardLink>
        </CardTitle>
        <CardDescription>{project.summary}</CardDescription>
        <p className="font-mono text-xs text-muted-foreground">
          {project.role} · {project.period}
        </p>
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
