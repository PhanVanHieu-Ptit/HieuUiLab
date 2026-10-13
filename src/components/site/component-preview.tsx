import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RegistryDemo } from '@/registry/types'

import { CodeBlock } from './code-block'

export function ComponentPreview({ demo }: { demo: RegistryDemo }) {
  const Demo = demo.component
  const headingId = `demo-${demo.id}`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 id={headingId} className="font-semibold tracking-tight">
          {demo.title}
        </h3>
        {demo.description ? (
          <p className="text-sm text-muted-foreground">{demo.description}</p>
        ) : null}
      </div>
      <Tabs defaultValue="preview">
        <TabsList aria-label={`${demo.title} example`}>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          <div className="flex min-h-40 items-center justify-center-safe overflow-x-auto rounded-lg border bg-surface p-6 text-surface-foreground sm:p-10">
            <Demo />
          </div>
        </TabsContent>
        <TabsContent value="code">
          <CodeBlock code={demo.code} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
