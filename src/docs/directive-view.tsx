import { lazy, Suspense } from 'react'
import { Link } from 'react-router'

import { CodeBlock } from '@/components/site/code-block'
import { PropsTable } from '@/components/site/props-table'
import { proseLinkClass, tableWrapClass } from '@/components/site/prose'
import { RegistryExampleView } from '@/components/site/registry-example-view'
import { ScrollRegion } from '@/components/site/scroll-region'
import { StatusBadge } from '@/components/site/status-badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getImplementedEntry, registry, registryHref } from '@/registry'
import { registryCategories, registryCategoryIds } from '@/registry/taxonomy'
import { isImplemented, type ImplementedEntry, type RegistryKind } from '@/registry/types'

import type { Directive } from './directives'
import { docSources } from './sources'
import { ThemeSwitcher } from './theme-switcher'
import { tokenGroups } from './tokens'

// The tokens table reads globals.css as text; only pages that show it download that.
const DesignTokensView = lazy(() =>
  import('./design-tokens-view').then((module) => ({ default: module.DesignTokensView })),
)

/** What a directive could not show, in place of the content. A note, not an alert: it is not urgent. */
export function DirectiveProblem({ title, message }: { title: string; message: string }) {
  return (
    <Alert variant="destructive" role="note" className="max-w-prose">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

function problem(directive: Directive, message: string) {
  return <DirectiveProblem title={`Cannot show ::${directive.name}`} message={message} />
}

function RegistryApi({ directive }: { directive: Directive }) {
  const slug = directive.attrs.slug ?? ''
  const part = directive.attrs.part
  const entry = getImplementedEntry(slug)
  if (!entry) return problem(directive, `There is no implemented registry entry "${slug}".`)
  const parts = part ? entry.api.parts.filter((item) => item.name === part) : entry.api.parts
  if (parts.length === 0) {
    return problem(directive, `"${slug}" documents no part named "${part ?? ''}".`)
  }
  return (
    <div className="flex flex-col gap-6">
      {parts.map((item) => (
        <div key={item.name} className="flex flex-col gap-2">
          <p className="font-mono text-sm font-semibold">{item.name}</p>
          {item.description ? (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          ) : null}
          <PropsTable props={item.props} caption={`${item.name} props`} />
        </div>
      ))}
      <p className="text-sm text-muted-foreground">
        From the API metadata of{' '}
        <Link to={`${registryHref(entry)}#api`} className={proseLinkClass}>
          {entry.name}
        </Link>
        , the same data its own page shows.
      </p>
    </div>
  )
}

function propCount(entry: ImplementedEntry): number {
  return entry.api.parts.reduce((total, part) => total + part.props.length, 0)
}

function RegistryIndex({ directive }: { directive: Directive }) {
  const kind = directive.attrs.kind as RegistryKind | undefined
  const category = directive.attrs.category
  if (category && !Object.hasOwn(registryCategories, category)) {
    return problem(directive, `"${category}" is not a registry category.`)
  }
  const entries = registry.filter(
    (entry): entry is ImplementedEntry =>
      isImplemented(entry) &&
      (kind === undefined || entry.kind === kind) &&
      (category === undefined || entry.category === category),
  )
  if (entries.length === 0) return problem(directive, 'No implemented entries match.')
  // Two indexes on one page (components, then blocks) need different table names.
  const noun = kind === 'component' ? 'components' : kind === 'block' ? 'blocks' : 'entries'
  return (
    <div className="flex flex-col gap-6">
      {registryCategoryIds.map((id) => {
        const inCategory = entries.filter((entry) => entry.category === id)
        if (inCategory.length === 0) return null
        const { label, description } = registryCategories[id]
        return (
          <div key={id} className="flex flex-col gap-2">
            <p className="font-semibold">
              {label} <span className="font-normal text-muted-foreground">{description}</span>
            </p>
            <ScrollRegion label={`${label} ${noun}, scrollable`} className={tableWrapClass}>
              <Table>
                <TableCaption className="sr-only">
                  {label} {noun}
                </TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {/* Fixed widths keep the columns aligned from one category's table to the next. */}
                    <TableHead className="w-48">Entry</TableHead>
                    <TableHead className="w-36">Status</TableHead>
                    <TableHead>Exports</TableHead>
                    <TableHead className="w-44 text-right">Documented props</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inCategory.map((entry) => (
                    <TableRow key={entry.slug}>
                      <TableHead scope="row" className="h-auto py-2.5 align-top">
                        <Link to={registryHref(entry)} className={proseLinkClass}>
                          {entry.name}
                        </Link>
                      </TableHead>
                      <TableCell className="align-top">
                        <StatusBadge status={entry.status} size="sm" />
                      </TableCell>
                      <TableCell className="align-top font-mono text-xs text-muted-foreground">
                        {entry.api.parts.map((part) => part.name).join(', ')}
                      </TableCell>
                      <TableCell className="text-right align-top tabular-nums">
                        {propCount(entry)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollRegion>
          </div>
        )
      })}
    </div>
  )
}

function RegistryExample({ directive }: { directive: Directive }) {
  const slug = directive.attrs.slug ?? ''
  const id = directive.attrs.example ?? ''
  const entry = getImplementedEntry(slug)
  if (!entry) return problem(directive, `There is no implemented registry entry "${slug}".`)
  return (
    <RegistryExampleView
      entry={entry}
      exampleId={id}
      missing={problem(directive, `"${slug}" has no example "${id}".`)}
    />
  )
}

function Source({ directive }: { directive: Directive }) {
  const path = directive.attrs.path ?? ''
  const code = Object.hasOwn(docSources, path) ? docSources[path] : undefined
  if (code === undefined) {
    return problem(directive, `"${path}" is not in the list of files a page may show.`)
  }
  return <CodeBlock code={code} title={path} copyLabel={`Copy ${path}`} />
}

function DesignTokens({ directive }: { directive: Directive }) {
  const group = tokenGroups.find((item) => item === directive.attrs.group)
  if (!group) return problem(directive, `"${directive.attrs.group ?? ''}" is not a token group.`)
  return (
    <Suspense fallback={<div className="h-32" aria-hidden="true" />}>
      <DesignTokensView group={group} />
    </Suspense>
  )
}

/** Content generated from typed data at the place a page writes `::name{…}`. */
export function DirectiveView({ directive }: { directive: Directive }) {
  switch (directive.name) {
    case 'registry-api':
      return <RegistryApi directive={directive} />
    case 'registry-index':
      return <RegistryIndex directive={directive} />
    case 'registry-example':
      return <RegistryExample directive={directive} />
    case 'source':
      return <Source directive={directive} />
    case 'design-tokens':
      return <DesignTokens directive={directive} />
    case 'theme-switcher':
      return <ThemeSwitcher />
    default:
      return problem(directive, 'Unknown directive.')
  }
}
