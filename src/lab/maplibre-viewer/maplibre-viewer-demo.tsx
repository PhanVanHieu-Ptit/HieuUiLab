import { useState } from 'react'

import { resolveOnlineBasemap } from './config'
import { MapViewer } from './map-viewer'

/**
 * An interactive map on MapLibre GL JS. It opens on a bundled basemap with no network requests;
 * an online basemap is available only when the build configures one, and only after a click.
 */
export function MaplibreViewerDemo() {
  // Read once. A new object on every render would look like a changed prop to the viewer.
  // Each setting is read by name. Passing `import.meta.env` whole makes Vite inline every `VITE_`
  // variable present at build time into the public bundle, not just these four.
  const [online] = useState(() =>
    resolveOnlineBasemap({
      VITE_MAP_STYLE_URL: import.meta.env.VITE_MAP_STYLE_URL,
      VITE_MAP_API_KEY: import.meta.env.VITE_MAP_API_KEY,
      VITE_MAP_ATTRIBUTION: import.meta.env.VITE_MAP_ATTRIBUTION,
      VITE_MAP_PROVIDER_NAME: import.meta.env.VITE_MAP_PROVIDER_NAME,
    }),
  )
  return <MapViewer online={online} />
}
