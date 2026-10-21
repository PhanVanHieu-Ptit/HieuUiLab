import { useState } from 'react'

import { resolveOnlineBasemap } from './config'
import { MapViewer } from './map-viewer'

/**
 * An interactive map on MapLibre GL JS. It opens on a bundled basemap with no network requests;
 * an online basemap is available only when the build configures one, and only after a click.
 */
export function MaplibreViewerDemo() {
  // Read once. A new object on every render would look like a changed prop to the viewer.
  const [online] = useState(() => resolveOnlineBasemap(import.meta.env))
  return <MapViewer online={online} />
}
