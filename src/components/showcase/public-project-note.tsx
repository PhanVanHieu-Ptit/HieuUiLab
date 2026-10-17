import { ShieldCheck } from 'lucide-react'

import { projectPolicy } from '@/content/showcase-projects'

/**
 * Says what "Public project" means and what is not published. It sits on the projects page and
 * on each project, so the distinction is visible wherever a project is.
 */
export function PublicProjectNote({
  headingLevel: Heading = 'h2',
}: {
  headingLevel?: 'h2' | 'h3'
}) {
  return (
    <aside
      aria-label="About public projects"
      className="flex max-w-prose gap-3 rounded-lg border bg-surface p-4 text-surface-foreground"
    >
      <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-1.5">
        <Heading className="text-sm font-semibold">{projectPolicy.title}</Heading>
        {projectPolicy.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-sm text-pretty text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>
    </aside>
  )
}
