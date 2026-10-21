import type { Experiment, ExperimentKind } from './types'

export const experiments: readonly Experiment[] = [
  {
    slug: 'map-projections',
    title: 'Map projection explorer',
    summary:
      'Compare how equirectangular, Web Mercator, and orthographic projections place the same graticule and cities.',
    kind: 'geospatial',
    status: 'experimental',
    capabilities: [
      'Projection maths as pure, unit-tested functions',
      'SVG rendering with no map library or tile server',
      'Keyboard-operable controls and a data table for screen readers',
    ],
    body: [
      {
        heading: 'How it works',
        paragraphs: [
          'Each projection is a function from longitude and latitude to a point in its own coordinate space, or null when the point is not visible. The same graticule lines and city coordinates are passed through each one and drawn as SVG paths.',
          'Web Mercator clamps latitude at about ±85.05°, where the projected map becomes square. The orthographic projection culls points on the far side of the globe and can be rotated with the sliders.',
        ],
      },
      {
        heading: 'Why no map library',
        paragraphs: [
          'Libraries such as MapLibre handle tiles, labels, and interaction, but they hide the maths. Writing the projections by hand makes the distortion visible and keeps this page free of extra downloads. The map viewer experiment takes the opposite approach and uses MapLibre.',
        ],
      },
    ],
  },
  {
    slug: 'maplibre-viewer',
    title: 'Interactive map viewer with MapLibre',
    summary:
      'A MapLibre GL JS map of an invented island: toggleable layers, selectable features, a route, and a basemap that makes no network request until you ask for one.',
    kind: 'geospatial',
    status: 'experimental',
    capabilities: [
      'MapLibre GL JS over a bundled, tile-free basemap and synthetic data',
      'Layer toggles with status, feature selection, an info panel, and a legend',
      'One map per mount, every listener released on cleanup, no rebuild when state changes',
      'An optional online basemap, configured at build time and loaded only after a click',
    ],
    body: [
      {
        heading: 'How it works',
        paragraphs: [
          'The dataset, the camera and basemap settings, the style builders, the one module that talks to MapLibre, and the React controls live in separate files, so the style and the state can be tested without a GPU.',
          'React holds what the visitor chose: which layers are visible, what is selected, and which basemap is showing. A controller applies those choices to the map. A click is read from the map by a single listener, and the details shown come from the dataset rather than from the map.',
        ],
      },
      {
        heading: 'Basemap and network use',
        paragraphs: [
          'By default the basemap is drawn from data in the repository, so opening the page makes no tile requests. An online basemap can be configured when the site is built. It is requested only after the visitor presses the button, and the panel says what that shares with the provider.',
          'Public tile servers are shared services that can limit or block use. The viewer treats repeated refusals as a reason to return to the bundled basemap. The documentation lists each provider’s attribution and usage terms.',
        ],
      },
      {
        heading: 'Lifecycle and fallbacks',
        paragraphs: [
          'The map library is downloaded only in a browser that can create a WebGL2 context. The map is built once per mount: React’s double mount in development builds no second map, and leaving the page removes the map, its listeners, and its GPU context.',
          'If the browser has no WebGL2, or the library cannot be downloaded, the map area says what happened and what to try. Camera moves follow the system’s reduced-motion setting.',
        ],
      },
    ],
  },
  {
    slug: 'webgl-scene',
    title: 'WebGL scene with motion controls',
    summary:
      'A lit cube drawn with raw WebGL2 that respects reduced motion, pauses off-screen, and falls back when WebGL is unavailable.',
    kind: '3d',
    status: 'experimental',
    capabilities: [
      'Raw WebGL2 shaders and matrix maths, no 3D library',
      'Starts paused for reduced motion, with an explicit Play control',
      'Pauses off-screen and in hidden tabs; explains when WebGL is unavailable',
    ],
    body: [
      {
        heading: 'How it works',
        paragraphs: [
          'A vertex shader transforms a cube by a model matrix and a perspective view-projection matrix built in a small, tested mat4 module. The fragment shader applies simple diffuse lighting, and the colour is read from the site’s primary token so it follows the theme.',
          'The canvas resizes with its container and accounts for device pixel ratio. All buffers, shaders, and observers are released when the page is left.',
        ],
      },
      {
        heading: 'Motion and fallbacks',
        paragraphs: [
          'The animation loop only runs while the scene is playing, on-screen, and in a visible tab. With reduced motion requested, the scene shows a still frame until the user presses Play.',
          'If the browser cannot create a WebGL2 context, or the context is lost, the canvas is replaced by a message explaining why the scene is unavailable.',
        ],
      },
    ],
  },
]

export function getExperiment(slug: string): Experiment | undefined {
  return experiments.find((experiment) => experiment.slug === slug)
}

export interface ExperimentKindInfo {
  kind: ExperimentKind
  /** Badge label on cards and detail pages. */
  label: string
  /** Category page title and breadcrumb. */
  title: string
  /** URL segment under /labs. */
  path: string
  description: string
}

export const experimentKinds: Readonly<Record<ExperimentKind, ExperimentKindInfo>> = {
  geospatial: {
    kind: 'geospatial',
    label: 'Geospatial',
    title: 'Maps',
    path: 'maps',
    description:
      'Geospatial experiments: map projections written by hand, and an interactive map built with MapLibre GL JS.',
  },
  '3d': {
    kind: '3d',
    label: '3D',
    title: '3D',
    path: '3d',
    description: '3D graphics experiments drawn with raw WebGL2, without a 3D library.',
  },
}

export function getExperimentKind(path: string): ExperimentKindInfo | undefined {
  return Object.values(experimentKinds).find((info) => info.path === path)
}

export function getExperimentsOfKind(kind: ExperimentKind): readonly Experiment[] {
  return experiments.filter((experiment) => experiment.kind === kind)
}

export function experimentKindHref(path: string): string {
  return `/labs/${path}`
}

export function experimentHref(experiment: Pick<Experiment, 'kind' | 'slug'>): string {
  return `${experimentKindHref(experimentKinds[experiment.kind].path)}/${experiment.slug}`
}
