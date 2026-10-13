import { useParams } from 'react-router'

import { CodeBlock } from '@/components/site/code-block'
import { ComponentPreview } from '@/components/site/component-preview'
import { PropsTable } from '@/components/site/props-table'
import { StatusBadge } from '@/components/site/status-badge'
import { getRegistryEntry } from '@/registry'

import { NotFoundContent } from './not-found-page'

export function ComponentDetailPage() {
  const { slug = '' } = useParams()
  const entry = getRegistryEntry(slug)

  if (!entry) return <NotFoundContent />

  const installCommand = `pnpm add ${entry.dependencies.join(' ')}`

  return (
    <article className="space-y-12">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{entry.name}</h1>
          <StatusBadge status={entry.status} />
        </div>
        <p className="max-w-2xl text-muted-foreground">{entry.description}</p>
      </header>

      <section aria-labelledby="examples" className="space-y-8">
        <h2 id="examples" className="sr-only">
          Examples
        </h2>
        {entry.demos.map((demo) => (
          <ComponentPreview key={demo.id} demo={demo} />
        ))}
      </section>

      <section aria-labelledby="installation" className="space-y-4">
        <h2 id="installation" className="text-xl font-semibold tracking-tight">
          Installation
        </h2>
        <p className="text-sm text-muted-foreground">
          Install the dependencies, then copy the source to{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{entry.targetPath}</code>
          . It also expects a{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">cn</code> helper (clsx +
          tailwind-merge) and the semantic color tokens from this site&apos;s stylesheet.
        </p>
        <CodeBlock code={installCommand} title="terminal" />
        <CodeBlock code={entry.source} title={entry.targetPath} />
      </section>

      <section id="props" aria-labelledby="props-heading" className="scroll-mt-20 space-y-4">
        <h2 id="props-heading" className="text-xl font-semibold tracking-tight">
          Props
        </h2>
        <PropsTable props={entry.props} caption={`${entry.name} props`} />
      </section>
    </article>
  )
}
