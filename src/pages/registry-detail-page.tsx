import { Link, useLoaderData } from 'react-router'

import { CodeBlock } from '@/components/site/code-block'
import { ComponentPreview } from '@/components/site/component-preview'
import { PageHeader, SectionHeader } from '@/components/site/page'
import { PropsTable } from '@/components/site/props-table'
import { StatusBadge } from '@/components/site/status-badge'
import { getRegistryEntry, registryHref } from '@/registry'
import type { RegistryEntry } from '@/registry/types'

const inlineCode = 'rounded-sm bg-muted px-1 py-0.5 font-mono text-xs'

/** Detail page for one registry entry, loaded by the route's `registryLoader`. */
export function RegistryDetailPage() {
  const entry = useLoaderData<RegistryEntry>()

  const installCommand = `pnpm add ${entry.dependencies.join(' ')}`
  const requires = (entry.registryDependencies ?? []).flatMap((dependency) => {
    const required = getRegistryEntry(dependency)
    return required ? [required] : []
  })

  return (
    <article className="flex flex-col gap-14">
      <PageHeader
        title={entry.name}
        meta={<StatusBadge status={entry.status} />}
        description={entry.description}
      />

      <section aria-labelledby="examples" className="flex flex-col gap-8">
        <SectionHeader id="examples" title="Examples" anchorLabel="Examples" />
        {entry.demos.map((demo) => (
          <ComponentPreview key={demo.id} demo={demo} />
        ))}
      </section>

      <section aria-labelledby="installation" className="flex flex-col gap-4">
        <SectionHeader
          id="installation"
          title="Installation"
          anchorLabel="Installation"
          description={
            <>
              Install the dependencies, then copy the source to{' '}
              <code className={inlineCode}>{entry.targetPath}</code>. It also expects a{' '}
              <code className={inlineCode}>cn</code> helper (clsx + tailwind-merge) and the semantic
              tokens and state utilities from this site&apos;s stylesheet.
            </>
          }
        />
        {requires.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Also copy these registry entries first:{' '}
            {requires.map((required, index) => (
              <span key={required.slug}>
                {index > 0 ? ', ' : null}
                <Link
                  to={registryHref(required)}
                  className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-ring"
                >
                  {required.name}
                </Link>
              </span>
            ))}
            .
          </p>
        ) : null}
        {entry.dependencies.length > 0 ? (
          <CodeBlock code={installCommand} language="bash" title="terminal" />
        ) : null}
        <CodeBlock code={entry.source} title={entry.targetPath} />
      </section>

      <section aria-labelledby="props" className="flex flex-col gap-4">
        <SectionHeader id="props" title="Props" anchorLabel="Props" />
        <PropsTable props={entry.props} caption={`${entry.name} props`} />
      </section>
    </article>
  )
}
