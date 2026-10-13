import type { Experiment } from './types'

export const experiments: readonly Experiment[] = [
  {
    slug: 'map-projections',
    title: 'Map projection explorer',
    summary:
      'Compare how equirectangular, Web Mercator, and orthographic projections place the same graticule and cities.',
    kind: 'geospatial',
    status: 'beta',
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
    status: 'beta',
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

export const experimentKindLabel = { geospatial: 'Geospatial', '3d': '3D' } as const
