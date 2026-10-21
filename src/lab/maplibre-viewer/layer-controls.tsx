import { useId } from 'react'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { LAYER_IDS, LAYERS, type LayerId } from './layers'
import { displayStatus, type ViewerState } from './viewer-state'

type Status = ReturnType<typeof displayStatus>

const STATUS_LABELS: Readonly<Record<Status, string>> = {
  hidden: 'Hidden',
  loading: 'Loading',
  ready: 'Ready',
  error: 'Error',
}

const STATUS_VARIANTS: Readonly<Record<Status, NonNullable<BadgeProps['variant']>>> = {
  hidden: 'neutral',
  loading: 'info',
  ready: 'success',
  error: 'destructive',
}

export interface LayerControlsProps {
  state: Pick<ViewerState, 'visibility' | 'layerStatus'>
  onToggle: (layer: LayerId, visible: boolean) => void
}

/** One switch per data layer, with the layer’s state in words next to it. */
export function LayerControls({ state, onToggle }: LayerControlsProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-lg border p-4">
      <h3 id={headingId} className="text-sm font-semibold">
        Layers
      </h3>
      <ul className="flex flex-col gap-3">
        {LAYER_IDS.map((layer) => (
          <LayerRow
            key={layer}
            layer={layer}
            visible={state.visibility[layer]}
            status={displayStatus(state, layer)}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </section>
  )
}

interface LayerRowProps {
  layer: LayerId
  visible: boolean
  status: Status
  onToggle: (layer: LayerId, visible: boolean) => void
}

function LayerRow({ layer, visible, status, onToggle }: LayerRowProps) {
  const switchId = useId()
  const descriptionId = useId()
  const info = LAYERS[layer]
  return (
    <li className="flex items-start gap-3">
      <Switch
        id={switchId}
        size="sm"
        className="mt-0.5"
        checked={visible}
        aria-describedby={descriptionId}
        onCheckedChange={(checked) => {
          onToggle(layer, checked)
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor={switchId}>{info.label}</Label>
          <Badge size="sm" variant={STATUS_VARIANTS[status]}>
            <span className="sr-only">Status: </span>
            {STATUS_LABELS[status]}
          </Badge>
        </div>
        <p id={descriptionId} className="text-xs text-pretty text-muted-foreground">
          {info.description}
        </p>
      </div>
    </li>
  )
}
