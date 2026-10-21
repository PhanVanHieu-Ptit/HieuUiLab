import { TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useReducer, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

import { supportsWebgl2 } from '../shared/webgl-support'
import { BasemapPanel } from './basemap-panel'
import type { OnlineBasemap } from './config'
import { getFeatureDetails } from './data'
import { FeatureInfoPanel } from './feature-info-panel'
import { FeatureList } from './feature-list'
import { LayerControls } from './layer-controls'
import { LAYER_IDS, type FeatureRef, type LayerId } from './layers'
import { Legend } from './legend'
import { readMapPalette } from './theme-colors'
import { useMapController } from './use-map-controller'
import { MapFailure, MapLoading, MapUnavailable } from './viewer-states'
import { initialViewerState, viewerReducer } from './viewer-state'

export interface MapViewerProps {
  /** What the build offers as an online basemap. Reading it never starts a request. */
  online: OnlineBasemap
}

/** The interactive map with its controls. Holds the visitor’s choices; the map follows them. */
export function MapViewer({ online }: MapViewerProps) {
  // Probed once, before the map library is imported: a browser that cannot run it never fetches it.
  const [supported] = useState(supportsWebgl2)
  const [state, dispatch] = useReducer(viewerReducer, initialViewerState)
  const { containerRef, controller, phase, contextLost, attempt, retry } =
    useMapController(dispatch)
  const { resolvedTheme } = useTheme()

  // The effects below only push what the visitor chose into the map. They depend on `controller`,
  // so a fresh map (after Retry) is brought up to date, and none of them can build a new one.
  useEffect(() => {
    if (!controller) return
    for (const layer of LAYER_IDS) controller.setLayerVisibility(layer, state.visibility[layer])
  }, [controller, state.visibility])

  useEffect(() => {
    controller?.selectFeature(state.selected)
  }, [controller, state.selected])

  // The `dark` class is already on <html> when this runs, so the tokens read back are the new ones.
  useEffect(() => {
    controller?.setPalette(readMapPalette())
  }, [controller, resolvedTheme])

  const styleUrl = online.status === 'ready' ? online.styleUrl : null
  const attribution = online.status === 'ready' ? online.attribution : null
  useEffect(() => {
    if (!controller) return
    if (state.basemap.requested === 'online' && styleUrl !== null && attribution !== null) {
      controller.setBasemap({ styleUrl, attribution })
    } else {
      controller.setBasemap('bundled')
    }
  }, [controller, state.basemap.requested, styleUrl, attribution])

  const toggleLayer = useCallback((layer: LayerId, visible: boolean) => {
    dispatch({ type: 'toggleLayer', layer, visible })
  }, [])
  const selectFromList = useCallback(
    (ref: FeatureRef) => {
      dispatch({ type: 'select', ref })
      controller?.focusFeature(ref)
    },
    [controller],
  )
  const clearSelection = useCallback(() => {
    dispatch({ type: 'clearSelection' })
  }, [])
  const requestOnline = useCallback(() => {
    dispatch({ type: 'requestOnline' })
  }, [])
  const useBundled = useCallback(() => {
    dispatch({ type: 'useBundled' })
  }, [])

  if (!supported) return <MapUnavailable />

  const selectedName = state.selected ? featureName(state.selected) : null

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <figure className="flex min-w-0 flex-col gap-3">
        <div className="relative h-96 overflow-hidden rounded-lg border bg-muted/40 sm:h-[30rem] lg:h-[36rem]">
          {/* MapLibre owns everything inside this div, so it has no React children and a fixed class. */}
          <div key={attempt} ref={containerRef} className="size-full" />
          {phase.kind === 'loading' ? <MapLoading /> : null}
          {phase.kind === 'error' ? <MapFailure error={phase.error} onRetry={retry} /> : null}
        </div>
        {contextLost ? (
          <Alert variant="warning">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>The graphics context was lost</AlertTitle>
            <AlertDescription>
              The browser dropped the map’s GPU context. It usually comes back by itself; if the map
              stays blank, reload the page.
            </AlertDescription>
          </Alert>
        ) : null}
        <figcaption className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            Synthetic sample data. Drag to pan, scroll with Ctrl or ⌘ held to zoom, or use the
            buttons on the map.
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={controller === null}
            onClick={() => {
              controller?.resetView()
            }}
          >
            Reset view
          </Button>
        </figcaption>
      </figure>

      <aside aria-label="Map details" className="flex min-w-0 flex-col gap-4">
        <FeatureInfoPanel selected={state.selected} onClear={clearSelection} />
        <BasemapPanel
          basemap={state.basemap}
          online={online}
          onRequestOnline={requestOnline}
          onUseBundled={useBundled}
        />
        <LayerControls state={state} onToggle={toggleLayer} />
        <FeatureList
          visibility={state.visibility}
          selected={state.selected}
          onSelect={selectFromList}
        />
        <Legend />
      </aside>

      {/* One polite announcement per selection; the panel itself is not a live region. */}
      <p className="sr-only" aria-live="polite">
        {selectedName ? `Selected ${selectedName}.` : ''}
      </p>
    </div>
  )
}

function featureName(ref: FeatureRef): string | null {
  const details = getFeatureDetails(ref)
  if (!details) return null
  switch (details.layer) {
    case 'sites':
      return details.site.name
    case 'route':
      return details.route.name
    case 'zones':
      return details.zone.name
  }
}
