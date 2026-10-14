import { GitPullRequest, MessageSquare, ShieldAlert } from 'lucide-react'
import { useState } from 'react'

import { NotificationItem } from '@/components/ui/notification-item'

interface Notice {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
  icon: 'review' | 'comment' | 'security'
}

const icons = {
  review: <GitPullRequest />,
  comment: <MessageSquare />,
  security: <ShieldAlert />,
}

const timeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
})

// Example data, held in memory.
const initial: readonly Notice[] = [
  {
    id: 'n1',
    title: 'Review requested on “Add data table”',
    description: 'Mai Tran asked for your review.',
    timestamp: '2026-10-12T15:20:00Z',
    read: false,
    icon: 'review',
  },
  {
    id: 'n2',
    title: 'New sign-in from Firefox on Linux',
    description: 'If this wasn’t you, revoke the session.',
    timestamp: '2026-10-12T09:02:00Z',
    read: false,
    icon: 'security',
  },
  {
    id: 'n3',
    title: 'Diego replied to your comment',
    description: '“Agreed, let’s keep the grid pattern out.”',
    timestamp: '2026-10-11T18:45:00Z',
    read: true,
    icon: 'comment',
  },
]

export function NotificationItemDemo() {
  const [items, setItems] = useState(initial)

  return (
    <ul aria-label="Notifications" className="flex w-full max-w-md flex-col gap-1">
      {items.map((item) => (
        <li key={item.id}>
          <NotificationItem
            icon={icons[item.icon]}
            title={item.title}
            description={item.description}
            timestamp={item.timestamp}
            timeLabel={timeFormat.format(new Date(item.timestamp))}
            read={item.read}
            onMarkRead={() => {
              setItems((current) =>
                current.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)),
              )
            }}
          />
        </li>
      ))}
    </ul>
  )
}
