import { Construction } from 'lucide-react'
import { Link, useLoaderData } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { CodeBlock } from '@/components/site/code-block'
import { ComponentPreview } from '@/components/site/component-preview'
import { PageHeader, SectionHeader } from '@/components/site/page'
import { PropsTable } from '@/components/site/props-table'
import { StatusBadge } from '@/components/site/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { getRegistryEntry, kindBasePath, registry, registryHref } from '@/registry'
import { resolveInstallPlan } from '@/registry/install'
import { registryPackages, registryRequirements } from '@/registry/packages'
import { registryCategories } from '@/registry/taxonomy'
import {
  isImplemented,
  type ImplementedEntry,
  type PlannedEntry,
  type RegistryEntry,
} from '@/registry/types'

const inlineCode = 'rounded-sm bg-muted px-1 py-0.5 font-mono text-xs'
const proseLink = 'rounded-sm font-medium text-foreground underline underline-offset-4 focus-ring'

/** Renders `backticked` spans of a guideline as inline code. */
function withInlineCode(text: string) {
  return text.split(/`([^`]+)`/).map((part, index) =>
    index % 2 === 1 ? (
      <code key={index} className={cn(inlineCode, 'text-foreground')}>
        {part}
      </code>
    ) : (
      part
    ),
  )
}

/** Detail page for one registry entry, loaded by the route's `registryLoader`. */
export function RegistryDetailPage() {
  const entry = useLoaderData<RegistryEntry>()
  return isImplemented(entry) ? (
    <ImplementedDetail entry={entry} />
  ) : (
    <PlannedDetail entry={entry} />
  )
}

function EntryHeader({ entry }: { entry: RegistryEntry }) {
  return (
    <PageHeader
      title={entry.name}
      meta={<StatusBadge status={entry.status} />}
      description={entry.description}
      actions={
        <ul aria-label="Category and tags" className="flex flex-wrap gap-2">
          <li>
            <Badge variant="primary">{registryCategories[entry.category].label}</Badge>
          </li>
          {entry.tags.map((tag) => (
            <li key={tag}>
              <Badge variant="outline" className="font-mono">
                {tag}
              </Badge>
            </li>
          ))}
        </ul>
      }
    />
  )
}

function ImplementedDetail({ entry }: { entry: ImplementedEntry }) {
  const { installation } = entry
  const plan = resolveInstallPlan(entry, (slug) => getRegistryEntry(slug))

  return (
    <article className="flex flex-col gap-14">
      <EntryHeader entry={entry} />

      <section aria-labelledby="examples" className="flex flex-col gap-8">
        <SectionHeader id="examples" title="Examples" anchorLabel="Examples" />
        {entry.examples.map((example) => (
          <ComponentPreview key={example.id} example={example} />
        ))}
      </section>

      {entry.guidelines && entry.guidelines.length > 0 ? (
        <section aria-labelledby="usage" className="flex flex-col gap-4">
          <SectionHeader id="usage" title="Usage" anchorLabel="Usage" />
          <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground marker:text-border">
            {entry.guidelines.map((guideline) => (
              <li key={guideline}>{withInlineCode(guideline)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="installation" className="flex flex-col gap-4">
        <SectionHeader
          id="installation"
          title="Installation"
          anchorLabel="Installation"
          description={
            <>
              Set up the requirements, install the packages, then copy the source to{' '}
              <code className={inlineCode}>{installation.targetPath}</code>.
            </>
          }
        />

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Requirements</h3>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground marker:text-border">
            {installation.requirements.map((id) => {
              const requirement = registryRequirements[id]
              return (
                <li key={id}>
                  <Link to={requirement.href} className={proseLink}>
                    {requirement.title}
                  </Link>
                  : {requirement.description}
                </li>
              )
            })}
          </ul>
        </div>

        {plan.entries.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Registry dependencies</h3>
            <p className="text-sm text-muted-foreground">
              Also copy these registry entries first:{' '}
              {plan.entries.map((required, index) => (
                <span key={required.slug}>
                  {index > 0 ? ', ' : null}
                  <Link to={registryHref(required)} className={proseLink}>
                    {required.name}
                  </Link>
                </span>
              ))}
              .
            </p>
          </div>
        ) : null}

        {plan.packages.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Packages</h3>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {plan.packages.map((name) => (
                <li key={name}>
                  <code className={inlineCode}>{name}</code> — {registryPackages[name].purpose}
                </li>
              ))}
            </ul>
            <CodeBlock
              code={`pnpm add ${plan.packages.join(' ')}`}
              language="bash"
              title="terminal"
            />
          </div>
        ) : null}

        {installation.notes?.length ? (
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
            {installation.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}

        <CodeBlock code={entry.source} title={installation.targetPath} />
      </section>

      <section aria-labelledby="api" className="flex flex-col gap-6">
        <SectionHeader id="api" title="API reference" anchorLabel="API reference" />
        {entry.api.parts.map((part) => (
          <div key={part.name} className="flex flex-col gap-2">
            <h3 className="font-mono text-sm font-semibold">{part.name}</h3>
            {part.description ? (
              <p className="text-sm text-muted-foreground">{part.description}</p>
            ) : null}
            <PropsTable props={part.props} caption={`${part.name} props`} />
          </div>
        ))}
      </section>
    </article>
  )
}

function PlannedDetail({ entry }: { entry: PlannedEntry }) {
  const related = registry.filter(
    (other) =>
      other.category === entry.category && other.slug !== entry.slug && isImplemented(other),
  )

  return (
    <article className="flex flex-col gap-10">
      <EntryHeader entry={entry} />

      <EmptyState
        icon={<Construction />}
        headingLevel="h2"
        title="Not implemented yet"
        description="This entry is planned. There is no source, example, or install step to copy until it is built."
        actions={
          <Button asChild variant="outline">
            <Link to={kindBasePath[entry.kind]}>
              Browse implemented {entry.kind === 'component' ? 'components' : 'blocks'}
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="planned-scope" className="flex max-w-prose flex-col gap-3">
        <SectionHeader id="planned-scope" title="Planned scope" anchorLabel="Planned scope" />
        <p className="leading-7 text-pretty">{entry.plannedScope}</p>
      </section>

      {related.length > 0 ? (
        <section aria-labelledby="related" className="flex flex-col gap-3">
          <SectionHeader
            id="related"
            title={`Available in ${registryCategories[entry.category].label}`}
            anchorLabel="Related entries"
          />
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {related.map((other) => (
              <li key={other.slug}>
                <Link to={registryHref(other)} className={proseLink}>
                  {other.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
