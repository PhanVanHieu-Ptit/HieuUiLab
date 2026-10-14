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
          'Libraries such as MapLibre handle tiles, labels, and interaction, but they hide the maths. Writing the projections by hand makes the distortion visible and keeps this page free of extra downloads.',
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
      'Geospatial experiments: map projections and rendering written without a map library or tile server.',
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
