import { FlaskConical } from 'lucide-react'
import { Suspense } from 'react'

import { EmptyState } from '@/components/blocks/empty-state'
import { Spinner } from '@/components/ui/spinner'
import { labDemos } from '@/lab'

import { DemoErrorBoundary } from './demo-error-boundary'

function DemoFallback() {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted/40">
      <Spinner label="Loading experiment" />
    </div>
  )
}

/**
 * The running lab experiment for a slug: lazy, contained if its chunk fails, and an honest message
 * when no demo has been built for it.
 */
export function DemoSlot({ slug }: { slug: string }) {
  const Demo = labDemos[slug]
  if (!Demo) {
    return (
      <EmptyState
        icon={<FlaskConical />}
        title="Demo not available yet"
        description="This experiment is documented but its interactive demo has not been built."
      />
    )
  }
  return (
    <DemoErrorBoundary>
      <Suspense fallback={<DemoFallback />}>
        <Demo />
      </Suspense>
    </DemoErrorBoundary>
  )
}
