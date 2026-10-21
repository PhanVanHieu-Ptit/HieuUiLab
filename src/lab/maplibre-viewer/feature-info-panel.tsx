import { useId, type ReactNode } from 'react'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import {
  SITE_CATEGORY_LABELS,
  SITE_STATUS_LABELS,
  getFeatureDetails,
  type FeatureDetails,
  type LngLat,
  type SiteProperties,
  type SiteStatus,
} from './data'
import type { FeatureRef } from './layers'

const STATUS_VARIANTS: Readonly<Record<SiteStatus, NonNullable<BadgeProps['variant']>>> = {
  open: 'success',
  limited: 'warning',
  closed: 'destructive',
}

function formatPosition([lng, lat]: LngLat): string {
  const part = (value: number, positive: string, negative: string) =>
    `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`
  return `${part(lat, 'N', 'S')}, ${part(lng, 'E', 'W')}`
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

function SiteBadges({ site }: { site: SiteProperties }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge size="sm" variant="outline">
        {SITE_CATEGORY_LABELS[site.category]}
      </Badge>
      <Badge size="sm" variant={STATUS_VARIANTS[site.status]}>
        {SITE_STATUS_LABELS[site.status]}
      </Badge>
    </div>
  )
}

function Details({ details }: { details: FeatureDetails }) {
  switch (details.layer) {
    case 'sites':
      return (
        <>
          <p className="font-medium">{details.site.name}</p>
          <SiteBadges site={details.site} />
          <p className="text-sm text-pretty text-muted-foreground">{details.site.note}</p>
          <dl className="flex flex-col gap-2">
            <Field label="Position">{formatPosition(details.position)}</Field>
            <Field label="Identifier">
              <code className="font-mono text-xs">{details.site.id}</code>
            </Field>
          </dl>
        </>
      )
    case 'route':
      return (
        <>
          <p className="font-medium">{details.route.name}</p>
          <Badge size="sm" variant="outline" className="self-start">
            Route
          </Badge>
          <p className="text-sm text-pretty text-muted-foreground">{details.route.note}</p>
          <dl className="flex flex-col gap-2">
            <Field label="Length">{details.lengthKm.toFixed(1)} km</Field>
            <Field label="Stops, in order">
              <ol className="list-inside list-decimal">
                {details.stops.map((stop, index) => (
                  // A loop visits the hub twice, so the name alone is not a unique key.
                  <li key={`${stop.id}-${String(index)}`}>{stop.name}</li>
                ))}
              </ol>
            </Field>
          </dl>
        </>
      )
    case 'zones':
      return (
        <>
          <p className="font-medium">{details.zone.name}</p>
          <Badge size="sm" variant="outline" className="self-start">
            Zone
          </Badge>
          <p className="text-sm text-pretty text-muted-foreground">{details.zone.note}</p>
          <dl className="flex flex-col gap-2">
            <Field label="Sites inside">
              {details.sites.length === 0 ? (
                'None'
              ) : (
                <ul className="list-inside list-disc">
                  {details.sites.map((site) => (
                    <li key={site.id}>{site.name}</li>
                  ))}
                </ul>
              )}
            </Field>
          </dl>
        </>
      )
  }
}

export interface FeatureInfoPanelProps {
  selected: FeatureRef | null
  onClear: () => void
}

/** What is known about the selected feature, read from the dataset rather than from the map. */
export function FeatureInfoPanel({ selected, onClear }: FeatureInfoPanelProps) {
  const headingId = useId()
  const details = selected ? getFeatureDetails(selected) : null
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-lg border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 id={headingId} className="text-sm font-semibold">
          Selected feature
        </h3>
        {details ? (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        ) : null}
      </div>
      {details ? (
        <Details details={details} />
      ) : (
        <p className="text-sm text-pretty text-muted-foreground">
          Nothing is selected. Click a marker, the route, or a zone on the map, or choose a feature
          from the list.
        </p>
      )}
    </section>
  )
}
