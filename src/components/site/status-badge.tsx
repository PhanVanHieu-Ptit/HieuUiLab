import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { RegistryStatus } from '@/registry/types'

const variants: Record<RegistryStatus, BadgeProps['variant']> = {
  stable: 'success',
  experimental: 'warning',
  planned: 'outline',
}

const labels: Record<RegistryStatus, string> = {
  stable: 'Stable',
  experimental: 'Experimental',
  planned: 'Planned',
}

export function StatusBadge({
  status,
  size,
}: {
  status: RegistryStatus
  size?: BadgeProps['size']
}) {
  return (
    <Badge variant={variants[status]} size={size ?? 'md'}>
      {labels[status]}
    </Badge>
  )
}
