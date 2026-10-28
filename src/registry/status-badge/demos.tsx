import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void'

// One mapping from domain status to tone and label, used everywhere the status appears.
const invoiceStatus: Record<InvoiceStatus, { tone: StatusTone; label: string }> = {
  draft: { tone: 'neutral', label: 'Draft' },
  sent: { tone: 'info', label: 'Sent' },
  paid: { tone: 'success', label: 'Paid' },
  overdue: { tone: 'warning', label: 'Overdue' },
  void: { tone: 'destructive', label: 'Void' },
}

export function StatusBadgeDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {(Object.keys(invoiceStatus) as InvoiceStatus[]).map((status) => (
        <StatusBadge key={status} tone={invoiceStatus[status].tone}>
          {invoiceStatus[status].label}
        </StatusBadge>
      ))}
    </div>
  )
}
