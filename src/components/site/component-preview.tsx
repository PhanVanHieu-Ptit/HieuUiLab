import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/cn'
import type { PreviewConfig, RegistryExample } from '@/registry/types'

import { CodeBlock } from './code-block'

const frameHeights: Record<NonNullable<PreviewConfig['height']>, string> = {
  sm: 'min-h-28',
  md: 'min-h-40',
  lg: 'min-h-72',
}

export function ComponentPreview({ example }: { example: RegistryExample }) {
  const Example = example.component
  const headingId = `example-${example.id}`
  const { layout = 'centered', height = 'md' } = example.preview ?? {}

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 id={headingId} className="font-semibold tracking-tight">
          {example.title}
        </h3>
        {example.description ? (
          <p className="text-sm text-muted-foreground">{example.description}</p>
        ) : null}
      </div>
      <Tabs defaultValue="preview">
        <TabsList aria-label={`${example.title} example`}>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          <div
            className={cn(
              'flex overflow-x-auto rounded-lg border bg-surface p-6 text-surface-foreground sm:p-10',
              frameHeights[height],
              layout === 'centered'
                ? 'items-center justify-center-safe'
                : 'flex-col justify-center *:w-full',
            )}
          >
            <Example />
          </div>
        </TabsContent>
        <TabsContent value="code">
          <CodeBlock code={example.code} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
