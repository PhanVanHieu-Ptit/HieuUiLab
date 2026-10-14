import { useState } from 'react'

import { DetailPanel } from '@/components/blocks/detail-panel'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/cn'

interface Ticket {
  id: string
  subject: string
  requester: string
  priority: 'low' | 'high'
  body: string
}

// Example data, held in memory.
const tickets: readonly Ticket[] = [
  {
    id: 'T-311',
    subject: 'Export stuck at 90%',
    requester: 'Amara Okafor',
    priority: 'high',
    body: 'The CSV export of last month’s invoices has shown 90% for an hour.',
  },
  {
    id: 'T-310',
    subject: 'Change billing email',
    requester: 'Noah Kim',
    priority: 'low',
    body: 'Invoices should go to finance@example.com from next month.',
  },
  {
    id: 'T-309',
    subject: 'Two-factor codes not arriving',
    requester: 'Zoë Müller',
    priority: 'high',
    body: 'SMS codes stopped arriving this morning; authenticator app works.',
  },
]

export function DetailPanelDemo() {
  const [openId, setOpenId] = useState<string | null>(null)
  const ticket = tickets.find((item) => item.id === openId)

  return (
    <div className={cn('grid w-full gap-4', ticket && 'lg:grid-cols-[minmax(0,1fr)_16rem]')}>
      <ul aria-label="Tickets" className="divide-y self-start rounded-lg border bg-surface">
        {tickets.map((item) => (
          <li
            key={item.id}
            data-active={item.id === openId || undefined}
            className="flex items-center justify-between gap-3 px-4 py-3 data-[active]:bg-accent/60"
          >
            <button
              type="button"
              onClick={() => {
                setOpenId(item.id)
              }}
              className="cursor-pointer rounded-sm text-left text-sm font-medium focus-ring hover:underline"
            >
              {item.subject}
            </button>
            <span className="font-mono text-xs text-muted-foreground">{item.id}</span>
          </li>
        ))}
      </ul>
      <DetailPanel
        open={ticket !== undefined}
        onOpenChange={(open) => {
          if (!open) setOpenId(null)
        }}
        title={ticket?.subject ?? 'Ticket'}
        description={ticket ? `${ticket.id} from ${ticket.requester}` : undefined}
      >
        {ticket ? (
          <>
            <StatusBadge
              tone={ticket.priority === 'high' ? 'warning' : 'neutral'}
              className="self-start"
            >
              {ticket.priority === 'high' ? 'High priority' : 'Low priority'}
            </StatusBadge>
            <p className="text-sm">{ticket.body}</p>
          </>
        ) : null}
      </DetailPanel>
    </div>
  )
}
