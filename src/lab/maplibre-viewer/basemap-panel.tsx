import { Globe, TriangleAlert } from 'lucide-react'
import { useId } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { describeUnavailable, type OnlineBasemap } from './config'
import type { ViewerState } from './viewer-state'

export interface BasemapPanelProps {
  basemap: ViewerState['basemap']
  online: OnlineBasemap
  onRequestOnline: () => void
  onUseBundled: () => void
}

/**
 * Which basemap is showing, and the opt-in to a provider’s tiles. Nothing is requested from a
 * provider until the visitor presses the button, and the panel says what that sends.
 */
export function BasemapPanel({ basemap, online, onRequestOnline, onUseBundled }: BasemapPanelProps) {
  const headingId = useId()
  const noteId = useId()
  const usingOnline = basemap.requested === 'online'

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 id={headingId} className="text-sm font-semibold">
          Basemap
        </h3>
        <Badge size="sm" variant={usingOnline ? 'info' : 'neutral'}>
          {usingOnline ? (basemap.phase === 'loading' ? 'Online, loading' : 'Online') : 'Bundled'}
        </Badge>
      </div>

      <p className="text-xs text-pretty text-muted-foreground">
        {usingOnline && online.status === 'ready'
          ? `Tiles and labels from ${online.providerName} (${online.host}), with the sample layers drawn on top.`
          : 'An invented island over a plain background, drawn from data in this repository. Showing it makes no network requests.'}
      </p>

      {basemap.error ? (
        <Alert variant="warning">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>Online basemap stopped</AlertTitle>
          <AlertDescription>{basemap.error}</AlertDescription>
        </Alert>
      ) : null}

      {online.status === 'ready' ? (
        <>
          <p id={noteId} className="text-xs text-pretty text-muted-foreground">
            {usingOnline
              ? `Credit: ${online.attribution}`
              : `Loading it contacts ${online.host}, which can see your IP address and the area you view. Public tile services are shared and best-effort, and can limit or block use. Credit: ${online.attribution}`}
          </p>
          {usingOnline ? (
            <Button variant="outline" size="sm" className="self-start" onClick={onUseBundled}>
              Use bundled basemap
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              aria-describedby={noteId}
              onClick={onRequestOnline}
            >
              <Globe aria-hidden="true" />
              Load online basemap
            </Button>
          )}
        </>
      ) : (
        <>
          <p id={noteId} className="text-xs text-pretty text-muted-foreground">
            {describeUnavailable(online)}
          </p>
          <Button variant="outline" size="sm" className="self-start" disabled aria-describedby={noteId}>
            <Globe aria-hidden="true" />
            Load online basemap
          </Button>
        </>
      )}
    </section>
  )
}
