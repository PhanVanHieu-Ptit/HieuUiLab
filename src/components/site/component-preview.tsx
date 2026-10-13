import { Tabs } from 'radix-ui'

import type { RegistryDemo } from '@/registry/types'

import { CodeBlock } from './code-block'

const tabTriggerClass =
  'relative h-9 px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:inset-x-3 data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary'

export function ComponentPreview({ demo }: { demo: RegistryDemo }) {
  const Demo = demo.component
  const headingId = `demo-${demo.id}`

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div>
        <h3 id={headingId} className="text-lg font-semibold tracking-tight">
          {demo.title}
        </h3>
        {demo.description ? (
          <p className="text-sm text-muted-foreground">{demo.description}</p>
        ) : null}
      </div>
      <Tabs.Root defaultValue="preview">
        <Tabs.List aria-label={`${demo.title} example`} className="flex border-b">
          <Tabs.Trigger value="preview" className={tabTriggerClass}>
            Preview
          </Tabs.Trigger>
          <Tabs.Trigger value="code" className={tabTriggerClass}>
            Code
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content
          value="preview"
          className="mt-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex min-h-40 items-center justify-center rounded-lg border bg-surface p-8 text-surface-foreground">
            <Demo />
          </div>
        </Tabs.Content>
        <Tabs.Content
          value="code"
          className="mt-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CodeBlock code={demo.code} />
        </Tabs.Content>
      </Tabs.Root>
    </section>
  )
}
