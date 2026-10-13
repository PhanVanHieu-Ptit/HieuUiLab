import { FolderPlus, SearchX } from 'lucide-react'

import { EmptyState } from '@/components/blocks/empty-state'
import { Button } from '@/components/ui/button'

export function EmptyStateDemo() {
  return (
    <EmptyState
      className="w-full max-w-md"
      icon={<FolderPlus />}
      title="No projects yet"
      description="Projects group your components and blocks. Create one to start collecting work."
      actions={
        <>
          <Button size="sm">Create project</Button>
          <Button size="sm" variant="ghost">
            Import
          </Button>
        </>
      }
    />
  )
}

export function EmptyStateSearchDemo() {
  return (
    <EmptyState
      className="w-full max-w-md border-solid bg-surface"
      icon={<SearchX />}
      title="No results for “datepicker”"
      description="Try a shorter query, or check the spelling."
      actions={
        <Button size="sm" variant="outline">
          Clear search
        </Button>
      }
    />
  )
}
