import { CircleCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

export function BadgeVariantsDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Neutral</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">
        <CircleCheck aria-hidden="true" />
        Stable
      </Badge>
      <Badge variant="warning">Beta</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="destructive">Deprecated</Badge>
    </div>
  )
}

export function BadgeSizesDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge size="sm" variant="primary">
        Small
      </Badge>
      <Badge size="md" variant="primary">
        Medium
      </Badge>
    </div>
  )
}
