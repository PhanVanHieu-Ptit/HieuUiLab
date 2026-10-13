import { useParams } from 'react-router'

import { CodeBlock } from '@/components/site/code-block'
import { ComponentPreview } from '@/components/site/component-preview'
import { PageHeader, SectionHeader } from '@/components/site/page'
import { PropsTable } from '@/components/site/props-table'
import { StatusBadge } from '@/components/site/status-badge'
import { getRegistryEntry } from '@/registry'

import { NotFoundContent } from './not-found-page'

const inlineCode = 'rounded-sm bg-muted px-1 py-0.5 font-mono text-xs'

export function ComponentDetailPage() {
  const { slug = '' } = useParams()
  const entry = getRegistryEntry(slug)

  if (!entry) return <NotFoundContent />

  const installCommand = `pnpm add ${entry.dependencies.join(' ')}`

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
