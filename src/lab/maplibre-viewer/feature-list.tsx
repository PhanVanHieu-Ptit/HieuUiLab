import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

import { SITE_CATEGORY_LABELS, featuresOfLayer, getSite } from './data'
import { LAYER_IDS, LAYERS, sameFeature, type FeatureRef, type LayerId } from './layers'

export interface FeatureListProps {
  visibility: Readonly<Record<LayerId, boolean>>
  selected: FeatureRef | null
  onSelect: (ref: FeatureRef) => void
}

/**
 * Every feature on the map as a button. This is the keyboard and screen-reader route to selecting
 * one, because the map canvas itself offers only panning and zooming.
 */
export function FeatureList({ visibility, selected, onSelect }: FeatureListProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-lg border p-4">
      <h3 id={headingId} className="text-sm font-semibold">
        Features
      </h3>
      <p className="text-xs text-pretty text-muted-foreground">
        Choose one to select it and move the map to it. Features on a hidden layer are disabled.
      </p>
      {LAYER_IDS.map((layer) => (
        <div key={layer} className="flex flex-col gap-1">
          <h4 className="text-xs font-medium text-muted-foreground">
            {LAYERS[layer].label}
            {visibility[layer] ? '' : ' (hidden)'}
          </h4>
          <ul className="flex flex-col">
            {featuresOfLayer(layer).map((feature) => {
              const ref: FeatureRef = { layer, id: feature.id }
              const isSelected = sameFeature(selected, ref)
              const site = layer === 'sites' ? getSite(feature.id) : undefined
              return (
                <li key={feature.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={isSelected}
                    disabled={!visibility[layer]}
                    className={cn('w-full justify-between font-normal', isSelected && 'bg-accent')}
                    onClick={() => {
                      onSelect(ref)
                    }}
                  >
                    <span className="truncate">{feature.name}</span>
                    {site ? (
                      <span className="text-xs text-muted-foreground">
                        {SITE_CATEGORY_LABELS[site.properties.category]}
                      </span>
                    ) : null}
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}
