import { Link } from 'react-router'

import { proseLinkClass } from '@/components/site/prose'
import { SmartLink } from '@/components/site/smart-link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { siteConfig } from '@/config/site'
import { getProjectEntry } from '@/content/project-entries'
import type { SkillDomain } from '@/content/profile-types'
import { repositoryFileUrl } from '@/content/showcase-types'
import { cn } from '@/lib/cn'
import { getNote, noteHref } from '@/notes/manifest'

interface Reference {
  href: string
  title: string
  kind: 'Project' | 'Case study' | 'Note'
}

/** The projects and notes a domain points at, resolved to titles. Unknown slugs are caught by the validator. */
function referencesOf(domain: SkillDomain): Reference[] {
  const projects = domain.projects.flatMap((slug): Reference[] => {
    const entry = getProjectEntry(slug)
    if (!entry) return []
    return [
      {
        href: `/projects/${slug}`,
        title: entry.project.title,
        kind: entry.kind === 'showcase' ? 'Project' : 'Case study',
      },
    ]
  })
  const articles = domain.notes.flatMap((slug): Reference[] => {
    const note = getNote(slug)
    return note ? [{ href: noteHref(note), title: note.title, kind: 'Note' }] : []
  })
  return [...projects, ...articles]
}

/** One engineering domain: what the repository shows, the tools, and where to see it. */
export function DomainCard({ domain }: { domain: SkillDomain }) {
  const references = referencesOf(domain)
  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle as="h3" className="text-lg">
          {domain.title}
        </CardTitle>
        <CardDescription className="text-pretty">{domain.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul aria-label={`${domain.title}: tools`} className="flex flex-wrap gap-1.5">
          {domain.tools.map((tool) => (
            <li key={tool.name}>
              <Badge size="sm" variant="outline">
                {tool.name}
              </Badge>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">See it in</p>
          <ul aria-label={`${domain.title}: projects and notes`} className="flex flex-col gap-1.5">
            {references.map((reference) => (
              <li key={reference.href} className="text-sm">
                <span className="font-mono text-xs text-muted-foreground">{reference.kind} · </span>
                <Link to={reference.href} className={proseLinkClass}>
                  {reference.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {domain.boundary ? (
          <p className="text-sm text-pretty text-muted-foreground">
            <span className="font-medium text-foreground">Limit: </span>
            {domain.boundary}
          </p>
        ) : null}

        <details className="mt-auto text-sm">
          <summary className="w-fit cursor-pointer rounded-sm text-muted-foreground focus-ring hover:text-foreground">
            Source files ({String(domain.evidence.length)})
          </summary>
          <ul aria-label={`${domain.title}: source files`} className="mt-2 flex flex-col gap-2">
            {domain.evidence.map((ref) => (
              <li key={`${ref.path}:${ref.anchor ?? ''}`} className="flex flex-col">
                <SmartLink
                  href={repositoryFileUrl({ url: siteConfig.githubUrl }, ref.path)}
                  className={cn('w-fit', proseLinkClass)}
                >
                  {ref.label}
                </SmartLink>
                <span className="font-mono text-xs break-all text-muted-foreground">
                  {ref.path}
                </span>
              </li>
            ))}
          </ul>
        </details>
      </CardContent>
    </Card>
  )
}
