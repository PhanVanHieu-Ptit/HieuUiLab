import { GitCommitHorizontal, Rocket, UserPlus } from 'lucide-react'

import { ActivityList, type ActivityEntry } from '@/components/blocks/activity-list'

const timeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
})

// Example data, held in memory. Newest first.
const entries: readonly ActivityEntry[] = [
  {
    id: 'e4',
    actor: 'Mai Tran',
    action: 'deployed',
    target: 'web to production',
    timestamp: '2026-10-12T09:14:00Z',
    icon: <Rocket />,
  },
  {
    id: 'e3',
    actor: 'Diego Ruiz',
    action: 'pushed 3 commits to',
    target: 'main',
    timestamp: '2026-10-12T08:41:00Z',
    icon: <GitCommitHorizontal />,
  },
  {
    id: 'e2',
    actor: 'Mai Tran',
    action: 'invited',
    target: 'Noah Kim',
    timestamp: '2026-10-11T16:05:00Z',
    icon: <UserPlus />,
  },
  {
    id: 'e1',
    actor: 'Warehouse sync',
    action: 'imported 128 products',
    timestamp: '2026-10-11T08:00:00Z',
  },
]

export function ActivityListDemo() {
  return (
    <ActivityList
      className="w-full max-w-md"
      label="Project activity"
      items={entries}
      formatTimestamp={(iso) => timeFormat.format(new Date(iso))}
    />
  )
}
