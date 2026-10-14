import { Construction } from 'lucide-react'
import { useState } from 'react'
import { Link, useLoaderData } from 'react-router'

import { EmptyState } from '@/components/blocks/empty-state'
import { CodeBlock } from '@/components/site/code-block'
import { ComponentPreview } from '@/components/site/component-preview'
import { PageHeader, SectionHeader } from '@/components/site/page'
import { Playground } from '@/components/site/playground'
import { PropsTable } from '@/components/site/props-table'
import { RegistryCard } from '@/components/site/registry-card'
import { StatusBadge } from '@/components/site/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'
import { getRegistryEntry, kindBasePath, registry, registryHref } from '@/registry'
import { registryDependents, relatedEntries } from '@/registry/catalog'
import { resolveInstallPlan } from '@/registry/install'
import { packageVersion, registryPackages, registryRequirements } from '@/registry/packages'
import { registryCategories } from '@/registry/taxonomy'
import {
  isImplemented,
  type ImplementedEntry,
  type PlannedEntry,
  type RegistryEntry,
} from '@/registry/types'
import { importStatement, usageSnippet } from '@/registry/usage'

const inlineCode = 'rounded-sm bg-muted px-1 py-0.5 font-mono text-xs'
const proseLink = 'rounded-sm font-medium text-foreground underline underline-offset-4 focus-ring'
const subheading = 'text-sm font-semibold'
const bulletList =
  'flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground marker:text-border'

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

/** Links to entries, comma separated, ending with a full stop. */
function EntryLinks({ entries }: { entries: readonly RegistryEntry[] }) {
  return entries.map((linked, index) => (
    <span key={linked.slug}>
      {index > 0 ? ', ' : null}
      <Link to={registryHref(linked)} className={proseLink}>
        {linked.name}
      </Link>
    </span>
  ))
}

function ImplementedDetail({ entry }: { entry: ImplementedEntry }) {
  const { installation } = entry
  const plan = resolveInstallPlan(entry, (slug) => getRegistryEntry(slug))
  const direct = plan.entries.filter((each) =>
    installation.registryDependencies.includes(each.slug),
  )
  const indirect = plan.entries.filter((each) => !direct.includes(each))
  const dependents = registryDependents(registry, entry.slug)
  const fileName = installation.targetPath.split('/').at(-1) ?? installation.targetPath
  const [codeTab, setCodeTab] = useState('usage')

  return (
    <article className="flex flex-col gap-14">
      <EntryHeader entry={entry} />

      {entry.playground ? <Playground entry={entry} playground={entry.playground} /> : null}

      <section aria-labelledby="examples" className="flex flex-col gap-8">
        <SectionHeader id="examples" title="Examples" anchorLabel="Examples" />
        {entry.examples.map((example) => (
          <ComponentPreview key={example.id} example={example} />
        ))}
      </section>

      <section aria-labelledby="code" className="flex flex-col gap-4">
        <SectionHeader
          id="code"
          title="Code"
          anchorLabel="Code"
          description="How to import and use it, and the full source to copy into your project."
        />
        <Tabs value={codeTab} onValueChange={setCodeTab}>
          <TabsList aria-label="Code">
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="source">Source</TabsTrigger>
          </TabsList>
          <TabsContent value="usage" className="flex flex-col gap-4">
            <CodeBlock code={importStatement(entry)} title="import" copyLabel="Copy import" />
            <CodeBlock code={usageSnippet(entry)} title="example" copyLabel="Copy usage example" />
            {entry.guidelines && entry.guidelines.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3 className={subheading}>Guidelines</h3>
                <ul
                  aria-label="Guidelines"
                  className={cn(bulletList, 'max-w-prose gap-2 text-pretty')}
                >
                  {entry.guidelines.map((guideline) => (
                    <li key={guideline}>{withInlineCode(guideline)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </TabsContent>
          <TabsContent value="source">
            <CodeBlock
              code={entry.source}
              title={installation.targetPath}
              copyLabel={`Copy ${fileName}`}
            />
          </TabsContent>
        </Tabs>
      </section>

      <section aria-labelledby="installation" className="flex flex-col gap-4">
        <SectionHeader
          id="installation"
          title="Installation"
          anchorLabel="Installation"
          description="Entries are copied into your project, not installed from a package. Follow these steps in order."
        />
        <ol className="flex list-decimal flex-col gap-5 pl-5 marker:text-sm marker:text-muted-foreground">
          {installation.requirements.length > 0 ? (
            <li className="space-y-2 pl-1">
              <h3 className={subheading}>Set up the requirements</h3>
              <ul className={bulletList}>
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
            </li>
          ) : null}
          {plan.packages.length > 0 ? (
            <li className="space-y-2 pl-1">
              <h3 className={subheading}>Install the packages</h3>
              <CodeBlock
                code={`pnpm add ${plan.packages.join(' ')}`}
                language="bash"
                title="terminal"
                copyLabel="Copy install command"
              />
            </li>
          ) : null}
          {plan.entries.length > 0 ? (
            <li className="space-y-2 pl-1">
              <h3 className={subheading}>Copy the registry entries it needs</h3>
              <p className="text-sm text-muted-foreground">
                Also copy these registry entries first: <EntryLinks entries={plan.entries} />.
              </p>
            </li>
          ) : null}
          <li className="space-y-2 pl-1">
            <h3 className={subheading}>Copy the source</h3>
            <p className="text-sm text-muted-foreground">
              Copy the file from the{' '}
              <a
                href="#code"
                className={proseLink}
                onClick={() => {
                  setCodeTab('source')
                }}
              >
                Source tab
              </a>{' '}
              to <code className={inlineCode}>{installation.targetPath}</code>.
            </p>
            {installation.notes?.length ? (
              <ul className={bulletList}>
                {installation.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </li>
        </ol>
      </section>

      <section aria-labelledby="dependencies" className="flex flex-col gap-4">
        <SectionHeader
          id="dependencies"
          title="Dependencies"
          anchorLabel="Dependencies"
          description="What this entry needs, including what its registry dependencies need, and what needs it."
        />
        {plan.packages.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-md text-left text-sm">
              <caption className="sr-only">npm packages</caption>
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Package
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Version
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plan.packages.map((name) => (
                  <tr key={name} className="align-top">
                    <th
                      scope="row"
                      className="px-4 py-3 font-mono text-xs font-medium whitespace-nowrap"
                    >
                      {name}
                    </th>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground">
                      {packageVersion(name) ?? '—'}
                    </td>
                    <td className="px-4 py-3">{registryPackages[name].purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="font-medium">Registry entries</dt>
          <dd className="text-muted-foreground">
            {direct.length > 0 ? <EntryLinks entries={direct} /> : 'None'}
            {indirect.length > 0 ? (
              <>
                {' '}
                (and through them: <EntryLinks entries={indirect} />)
              </>
            ) : null}
          </dd>
          <dt className="font-medium">Used by</dt>
          <dd className="text-muted-foreground">
            {dependents.length > 0 ? <EntryLinks entries={dependents} /> : 'No other entries'}
          </dd>
        </dl>
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

      <RelatedSection entry={entry} />
    </article>
  )
}

/** Entries related by registry dependencies, category, and shared tags. */
function RelatedSection({ entry }: { entry: RegistryEntry }) {
  const related = relatedEntries(entry, registry)
  if (related.length === 0) return null

  return (
    <section aria-labelledby="related" className="flex flex-col gap-4">
      <SectionHeader id="related" title="Related" anchorLabel="Related" />
      <ul aria-label="Related entries" className="grid gap-4 sm:grid-cols-2">
        {related.map(({ entry: other, reasons }) => (
          <li key={other.slug} className="flex">
            <RegistryCard entry={other} note={reasons.join(' · ')} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function PlannedDetail({ entry }: { entry: PlannedEntry }) {
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

      <RelatedSection entry={entry} />
    </article>
  )
}
