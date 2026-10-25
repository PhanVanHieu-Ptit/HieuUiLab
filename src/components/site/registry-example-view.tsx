import { Suspense, use, type ReactNode } from 'react'

import { loadEntryContent } from '@/registry/load'
import type { ImplementedEntry } from '@/registry/types'

import { ComponentPreview } from './component-preview'
import { DemoErrorBoundary } from './demo-error-boundary'

function LoadedExample({
  entry,
  exampleId,
  missing,
}: {
  entry: ImplementedEntry
  exampleId: string
  missing: ReactNode
}) {
  const example = use(loadEntryContent(entry)).examples.find((item) => item.id === exampleId)
  return example ? <ComponentPreview example={example} /> : missing
}

/**
 * One of an entry's examples, live and with its code, for pages that show an example outside the
 * entry's own page. The example's code arrives in its own chunk, so the space is held until then and
 * a chunk that fails to load is contained.
 */
export function RegistryExampleView({
  entry,
  exampleId,
  missing = null,
}: {
  entry: ImplementedEntry
  exampleId: string
  /** Shown when the entry has no such example. */
  missing?: ReactNode
}) {
  return (
    <DemoErrorBoundary>
      <Suspense fallback={<div className="min-h-40" aria-hidden="true" />}>
        <LoadedExample entry={entry} exampleId={exampleId} missing={missing} />
      </Suspense>
    </DemoErrorBoundary>
  )
}
