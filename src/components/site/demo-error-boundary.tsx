import { TriangleAlert } from 'lucide-react'
import { Component, type ReactNode } from 'react'

import { EmptyState } from '@/components/blocks/empty-state'
import { Button } from '@/components/ui/button'

interface DemoErrorBoundaryProps {
  children: ReactNode
}

interface DemoErrorBoundaryState {
  failed: boolean
}

/**
 * Contains a failing lazy demo (e.g. a chunk that no longer exists after a
 * deploy) so the rest of the page keeps working.
 */
export class DemoErrorBoundary extends Component<DemoErrorBoundaryProps, DemoErrorBoundaryState> {
  override state: DemoErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): DemoErrorBoundaryState {
    return { failed: true }
  }

  override render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert">
        <EmptyState
          icon={<TriangleAlert />}
          title="This demo couldn’t load"
          description="The rest of the page still works. Reloading usually fixes it, especially after the site has been updated."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.reload()
              }}
            >
              Reload page
            </Button>
          }
        />
      </div>
    )
  }
}
