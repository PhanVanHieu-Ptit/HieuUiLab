import { useState } from 'react'

import { ResourceList, type ResourceState } from '@/components/blocks/resource-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SavedView {
  id: string
  name: string
  filter: string
}

const views: readonly SavedView[] = [
  { id: 'open', name: 'Open issues', filter: 'is:open sort:updated' },
  { id: 'review', name: 'Needs design review', filter: 'label:design is:open' },
  { id: 'a11y', name: 'Accessibility', filter: 'label:a11y' },
]

type DemoState = 'ready' | 'loading' | 'empty' | 'error'

const states: Record<DemoState, ResourceState<SavedView>> = {
  ready: { status: 'ready', items: views },
  loading: { status: 'loading' },
  empty: { status: 'ready', items: [] },
  error: { status: 'error', message: 'The request timed out.' },
}

function isDemoState(value: string): value is DemoState {
  return value in states
}

export function ResourceListDemo() {
  const [current, setCurrent] = useState<DemoState>('ready')

  return (
    <Tabs
      variant="pill"
      value={current}
      onValueChange={(value) => {
        if (isDemoState(value)) setCurrent(value)
      }}
      className="w-full max-w-md"
    >
      <TabsList aria-label="List state">
        <TabsTrigger value="ready">Ready</TabsTrigger>
        <TabsTrigger value="loading">Loading</TabsTrigger>
        <TabsTrigger value="empty">Empty</TabsTrigger>
        <TabsTrigger value="error">Error</TabsTrigger>
      </TabsList>
      {(Object.keys(states) as DemoState[]).map((key) => (
        <TabsContent key={key} value={key}>
          <ResourceList
            label="saved views"
            state={states[key]}
            getKey={(view) => view.id}
            renderItem={(view) => (
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{view.name}</span>
                <code className="font-mono text-xs text-muted-foreground">{view.filter}</code>
              </div>
            )}
            empty={{ description: 'Save a filter to see it here.' }}
            onRetry={() => {
              setCurrent('ready')
            }}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
