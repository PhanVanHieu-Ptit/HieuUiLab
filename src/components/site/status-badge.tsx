import type { RegistryStatus } from '@/registry/types'
import { cn } from '@/lib/cn'

const styles: Record<RegistryStatus, string> = {
  stable: 'border-success/40 text-success',
  beta: 'border-warning/40 text-warning',
  planned: 'border-border text-muted-foreground',
}

export function StatusBadge({ status }: { status: RegistryStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
        styles[status],
      )}
    >
      {status}
    </span>
  )
}
