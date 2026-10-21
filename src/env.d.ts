/**
 * Build-time settings for the map viewer's optional online basemap. All are optional: with none
 * set, the viewer uses its bundled basemap and makes no network requests. See `.env.example`.
 *
 * Vite inlines these into the client bundle, so they are public. Never put a secret here.
 */
interface ImportMetaEnv {
  readonly VITE_MAP_STYLE_URL?: string | undefined
  readonly VITE_MAP_API_KEY?: string | undefined
  readonly VITE_MAP_ATTRIBUTION?: string | undefined
  readonly VITE_MAP_PROVIDER_NAME?: string | undefined
}
