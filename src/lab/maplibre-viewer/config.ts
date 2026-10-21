import { HUB_POSITION, type Bounds, type LngLat } from './data'

/**
 * Configuration for the map viewer: the camera, and the optional online basemap.
 *
 * The viewer never reaches a tile server by default. An online basemap needs a style URL set at
 * build time (see `.env.example`) and a click from the visitor. Public tile servers are shared,
 * best-effort services, so nothing here assumes they stay available or unlimited.
 */

export const MAP_VIEW: {
  readonly center: LngLat
  readonly zoom: number
  readonly minZoom: number
  readonly maxZoom: number
  readonly maxBounds: Bounds
  /** A real map is useful zoomed out, unlike the island, so the online basemap relaxes the limits. */
  readonly onlineMinZoom: number
} = {
  center: HUB_POSITION,
  zoom: 9.4,
  minZoom: 8,
  maxZoom: 13,
  maxBounds: [-36.5, 3.5, -33.5, 6.5],
  onlineMinZoom: 2,
}

/** The graticule line spacing, in degrees. */
export const GRATICULE_STEP = 0.25

/** The settings `resolveOnlineBasemap` reads. `import.meta.env` satisfies this type. */
export interface MapEnv {
  readonly VITE_MAP_STYLE_URL?: string | undefined
  readonly VITE_MAP_API_KEY?: string | undefined
  readonly VITE_MAP_ATTRIBUTION?: string | undefined
  readonly VITE_MAP_PROVIDER_NAME?: string | undefined
}

export type OnlineBasemapProblem =
  'not-a-url' | 'not-https' | 'has-credentials' | 'unresolved-placeholder'

export type OnlineBasemap =
  | { readonly status: 'unconfigured' }
  | { readonly status: 'invalid'; readonly reason: OnlineBasemapProblem }
  | { readonly status: 'missing-key' }
  | { readonly status: 'missing-attribution' }
  | {
      readonly status: 'ready'
      /** The full style URL, including any key. Never render this; show `host`. */
      readonly styleUrl: string
      readonly host: string
      /** Plain text. Escape it before handing it to anything that parses HTML. */
      readonly attribution: string
      readonly providerName: string
    }

const KEY_PLACEHOLDER = '{key}'
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function clean(value: string | undefined): string {
  return value?.trim() ?? ''
}

/**
 * Turn the build-time settings into a decision the UI can act on, without throwing.
 *
 * A style URL may contain `{key}`, which is replaced with the URL-encoded `VITE_MAP_API_KEY`. The
 * URL must be https (plain http is allowed only for a loopback host, for a local tile server) and
 * carry no credentials. An attribution string is required: providers make attribution a condition
 * of use, so the viewer refuses to enable an online basemap without one.
 */
export function resolveOnlineBasemap(env: MapEnv): OnlineBasemap {
  const template = clean(env.VITE_MAP_STYLE_URL)
  if (template === '') return { status: 'unconfigured' }

  // A key with no placeholder is ignored: a style URL has no other place to carry it.
  let styleUrl = template
  if (template.includes(KEY_PLACEHOLDER)) {
    const key = clean(env.VITE_MAP_API_KEY)
    if (key === '') return { status: 'missing-key' }
    styleUrl = template.replaceAll(KEY_PLACEHOLDER, encodeURIComponent(key))
  }
  if (/[{}]/.test(styleUrl)) return { status: 'invalid', reason: 'unresolved-placeholder' }

  let url: URL
  try {
    url = new URL(styleUrl)
  } catch {
    return { status: 'invalid', reason: 'not-a-url' }
  }
  const secure = url.protocol === 'https:'
  const loopback = url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname)
  if (!secure && !loopback) return { status: 'invalid', reason: 'not-https' }
  if (url.username !== '' || url.password !== '') {
    return { status: 'invalid', reason: 'has-credentials' }
  }

  const attribution = clean(env.VITE_MAP_ATTRIBUTION)
  if (attribution === '') return { status: 'missing-attribution' }

  return {
    status: 'ready',
    styleUrl: url.href,
    host: url.host,
    attribution,
    providerName: clean(env.VITE_MAP_PROVIDER_NAME) || url.hostname,
  }
}

const UNAVAILABLE_REASONS: Readonly<Record<OnlineBasemapProblem, string>> = {
  'not-a-url': 'The style URL is not a valid URL.',
  'not-https': 'The style URL must use https.',
  'has-credentials': 'The style URL must not contain a username or password.',
  'unresolved-placeholder': 'The style URL contains a placeholder other than {key}.',
}

/** Why the online basemap cannot be used, for the sidebar. Never includes the URL or the key. */
export function describeUnavailable(state: Exclude<OnlineBasemap, { status: 'ready' }>): string {
  switch (state.status) {
    case 'unconfigured':
      return 'No online basemap is configured. Set VITE_MAP_STYLE_URL when building to enable one.'
    case 'missing-key':
      return 'The style URL needs an API key. Set VITE_MAP_API_KEY when building.'
    case 'missing-attribution':
      return 'An online basemap needs VITE_MAP_ATTRIBUTION, the credit its provider requires.'
    case 'invalid':
      return UNAVAILABLE_REASONS[state.reason]
  }
}

/** Escape text for a context that parses HTML, such as MapLibre's attribution control. */
export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const SECRET_PARAMETER =
  /([?&#;](?:key|api[_-]?key|access[_-]?token|token|secret|auth)=)[^&#\s"')]+/gi

/** Mask the value of any query parameter that looks like a credential. */
export function redactSecrets(text: string): string {
  return text.replace(SECRET_PARAMETER, '$1[redacted]')
}
