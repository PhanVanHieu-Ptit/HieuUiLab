import { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHorizontalOverflow } from '@/hooks/use-horizontal-overflow'
import { cn } from '@/lib/cn'
import type { PreviewConfig, RegistryExample } from '@/registry/types'

import { CodeBlock } from './code-block'
import {
  previewViewportOptions,
  viewportWidthClass,
  type PreviewViewport,
} from './preview-viewport'
import { SegmentedControl } from './segmented-control'

const frameHeights: Record<NonNullable<PreviewConfig['height']>, string> = {
  sm: 'min-h-28',
  md: 'min-h-40',
  lg: 'min-h-72',
}

export function ComponentPreview({ example }: { example: RegistryExample }) {
  const Example = example.component
  const headingId = `example-${example.id}`
  const { layout = 'centered', height = 'md', responsive = false } = example.preview ?? {}
  const [viewport, setViewport] = useState<PreviewViewport>('full')
  const [frameRef, overflowing] = useHorizontalOverflow<HTMLDivElement>()

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
        {/* Kept mounted so a responsive example keeps its state on Code; Radix does not hide a
            force-mounted panel itself. */}
        <TabsContent
          value="preview"
          {...(responsive ? { forceMount: true, className: 'data-[state=inactive]:hidden' } : {})}
        >
          {responsive ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <SegmentedControl
                  legend="Preview width"
                  options={previewViewportOptions}
                  value={viewport}
                  onChange={setViewport}
                />
                <p className="text-xs text-muted-foreground">
                  Resizes the space the block is rendered in. Parts that use viewport breakpoints
                  still follow the browser window.
                </p>
              </div>
              <div
                ref={frameRef}
                // A region that scrolls must be focusable to be scrolled by keyboard (WCAG 2.1.1).
                {...(overflowing
                  ? {
                      role: 'region',
                      'aria-label': `${example.title} preview, scrollable`,
                      tabIndex: 0,
                    }
                  : {})}
                className={cn(
                  'flex flex-col justify-center overflow-x-auto rounded-lg border bg-surface p-3 text-surface-foreground focus-ring sm:p-6',
                  frameHeights[height],
                )}
              >
                {/* The block gets exactly this width; the frame's padding does not eat into it. */}
                <div
                  role="group"
                  aria-label={`${example.title} preview`}
                  data-viewport={viewport}
                  className={cn(
                    'mx-auto flex min-w-0 shrink-0 flex-col rounded-md',
                    // A little inset so content does not touch the edge of a narrower frame.
                    viewport !== 'full' && 'p-3 ring-1 ring-border',
                    viewportWidthClass[viewport],
                  )}
                >
                  <Example />
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </TabsContent>
        <TabsContent value="code">
          <CodeBlock code={example.code} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
