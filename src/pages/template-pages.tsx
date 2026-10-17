import { ArrowUpRight, LayoutTemplate } from 'lucide-react'
import { Suspense, use } from 'react'
import { Link, useLoaderData } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { ComponentPreview } from '@/components/site/component-preview'
import { TemplateCard } from '@/components/site/content-cards'
import { DemoErrorBoundary } from '@/components/site/demo-error-boundary'
import { PageHeader, SectionHeader } from '@/components/site/page'
import { RegistryCard } from '@/components/site/registry-card'
import { SmartLink } from '@/components/site/smart-link'
import { StatusBadge } from '@/components/site/status-badge'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { sections, siteConfig } from '@/config/site'
import { templateBlocks, templates, type Template } from '@/content/templates'
import { getRegistryEntry, registryHref } from '@/registry'
import type { RegistryEntry, RegistryExample } from '@/registry/types'
import { loadTemplate } from '@/templates/template-modules'

const proseLink = 'rounded-sm font-medium text-foreground underline underline-offset-4 focus-ring'
const inlineCode = 'rounded-sm bg-muted px-1 py-0.5 font-mono text-xs'

export function TemplatesIndexPage() {
  return (
    <article className="flex flex-col gap-8">
      <PageHeader title={sections.templates.title} description={sections.templates.description} />
      {templates.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate />}
          headingLevel="h2"
          title="No templates yet"
          description="Templates appear here once they run in the browser."
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {templates.map((template) => (
            <li key={template.slug} className="flex">
              <TemplateCard template={template} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

function PreviewFallback() {
  return (
    <div className="flex min-h-72 w-full items-center justify-center rounded-lg border bg-muted/40">
      <Spinner label="Loading template" />
    </div>
  )
}

/** Loads the template and its source together, then shows them in the standard preview. */
function TemplatePreview({ template }: { template: Template }) {
  const { Template: Component, source } = use(loadTemplate(template.slug))
  const example: RegistryExample = {
    id: template.slug,
    title: `${template.title} template`,
    description:
      'An example app with invented data. Resize the preview to see it reflow, then open the Code tab for the source it runs from.',
    component: Component,
    code: source,
    preview: { layout: 'fill', height: 'lg', responsive: true },
  }
  return <ComponentPreview example={example} />
}

const bulletList =
  'flex max-w-prose list-disc flex-col gap-2 pl-5 text-pretty marker:text-muted-foreground'

function blobUrl(path: string): string {
  return `${siteConfig.githubUrl}/blob/main/${path}`
}

/** Detail page for one example app, loaded by the route's `templateLoader`. */
export function TemplateDetailPage() {
  const template = useLoaderData<Template>()
  const blocks = templateBlocks(template)
    .map((slug) => getRegistryEntry(slug, 'block'))
    .filter((entry): entry is RegistryEntry => entry !== undefined)

  return (
    <article className="flex flex-col gap-14">
      <PageHeader
        title={template.title}
        meta={<StatusBadge status={template.status} />}
        description={template.summary}
        actions={
          <ul aria-label="Tags" className="flex flex-wrap gap-2">
            {template.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="outline" className="font-mono">
                  {tag}
                </Badge>
              </li>
            ))}
          </ul>
        }
      />

      <section aria-labelledby="preview" className="flex flex-col gap-4">
        <SectionHeader
          id="preview"
          title="Live preview"
          anchorLabel="Live preview"
          description={template.scenario}
        />
        <DemoErrorBoundary>
          <Suspense fallback={<PreviewFallback />}>
            <TemplatePreview template={template} />
          </Suspense>
        </DemoErrorBoundary>
      </section>

      <section aria-labelledby="blocks" className="flex flex-col gap-4">
        <SectionHeader
          id="blocks"
          title="Blocks used"
          anchorLabel="Blocks used"
          description="Every part of a view is one of these registry blocks, used through its public props."
        />
        <ul className="grid gap-4 sm:grid-cols-2">
          {blocks.map((entry) => (
            <li key={entry.slug} className="flex">
              <RegistryCard entry={entry} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="composition" className="flex flex-col gap-4">
        <SectionHeader
          id="composition"
          title="Views and composition"
          anchorLabel="Views and composition"
        />
        <ul aria-label="Views" className="grid gap-4 sm:grid-cols-3">
          {template.views.map((view) => (
            <li key={view.label} className="flex flex-col gap-1.5 rounded-lg border bg-surface p-4">
              <h3 className="font-semibold">{view.label}</h3>
              <p className="text-sm text-muted-foreground">{view.summary}</p>
              <p className="text-xs text-muted-foreground">
                {view.blocks.map((slug, index) => {
                  const entry = getRegistryEntry(slug, 'block')
                  return (
                    <span key={slug}>
                      {index > 0 ? ', ' : null}
                      {entry ? (
                        <Link to={registryHref(entry)} className={proseLink}>
                          {entry.name}
                        </Link>
                      ) : (
                        slug
                      )}
                    </span>
                  )
                })}
              </p>
            </li>
          ))}
        </ul>
        {template.composition.map((paragraph) => (
          <p key={paragraph} className="max-w-prose leading-7 text-pretty">
            {paragraph}
          </p>
        ))}
      </section>

      <section aria-labelledby="decisions" className="flex flex-col gap-4">
        <SectionHeader id="decisions" title="Design decisions" anchorLabel="Design decisions" />
        <ul className="flex flex-col gap-5">
          {template.decisions.map((decision) => (
            <li key={decision.title} className="flex max-w-prose flex-col gap-1">
              <h3 className="font-semibold">{decision.title}</h3>
              <p className="leading-7 text-pretty text-muted-foreground">{decision.rationale}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="limitations" className="flex flex-col gap-4">
        <SectionHeader id="limitations" title="Known limitations" anchorLabel="Known limitations" />
        <ul className={bulletList}>
          {template.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="files" className="flex flex-col gap-4">
        <SectionHeader
          id="files"
          title="Files and example data"
          anchorLabel="Files and example data"
          description="To use a template, copy its component and the shared shell, then add each block it uses from the block’s own page. Replace the example data with your own."
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Source</h3>
            <ul aria-label="Source files" className="flex flex-col gap-1.5 text-sm">
              {template.files.map((path) => (
                <li key={path}>
                  <SmartLink href={blobUrl(path)} className={proseLink}>
                    <code className={inlineCode}>{path}</code>
                    <ArrowUpRight aria-hidden="true" className="ml-1 inline size-3.5" />
                  </SmartLink>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Example data</h3>
            <ul aria-label="Example data files" className="flex flex-col gap-1.5 text-sm">
              {template.mockData.map((item) => (
                <li key={item.path}>
                  <SmartLink href={blobUrl(item.path)} className={proseLink}>
                    {item.label}
                    <ArrowUpRight aria-hidden="true" className="ml-1 inline size-3.5" />
                  </SmartLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </article>
  )
}
