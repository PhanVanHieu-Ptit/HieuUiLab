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
  {
    slug: 'three-scene',
    title: 'Three.js scene with orbit controls',
    summary:
      'Five solids on a lit grid, drawn with Three.js: orbit and zoom within limits, select a solid by clicking it or from a list, and reset the camera. The scene draws only when something changes.',
    kind: '3d',
    status: 'experimental',
    capabilities: [
      'Three.js with orbit controls limited so the camera stays above the ground and inside the stage',
      'Drawing on demand: no animation frame is requested while the scene is still',
      'Selecting a solid by clicking it or from a list, and camera buttons, so nothing needs a pointer',
      'Every geometry, material, listener, and the graphics context released when the page is left',
      'A scene made of layers, so extrusions or terrain can be added as another layer',
    ],
    body: [
      {
        heading: 'Rendering pipeline',
        paragraphs: [
          'The solids and the ground are objects in a scene graph. Each mesh pairs a geometry, which holds its vertices, with a material, which says how light changes its colour. Two lights shade them: a hemisphere light for the sky and a directional light for the sun. There are no shadows, reflections, or post-processing.',
          'A perspective camera looks at a point just above the ground. Each frame the renderer draws the scene as that camera sees it, with the camera’s position taken from the orbit controls. Clicking casts a ray from the camera through the clicked pixel and selects the nearest solid it crosses.',
        ],
        code: {
          language: 'text',
          title: 'What happens when something changes',
          code: [
            'drag, wheel, button, selection, theme, resize',
            '  -> invalidate()            coalesced: any number of calls cost one frame',
            '  -> next animation frame    controls.update() moves the camera',
            '  -> renderer.render()       scene graph + camera -> pixels',
            '  -> still moving?           request another frame, or go quiet',
          ].join('\n'),
        },
      },
      {
        heading: 'Design decisions',
        paragraphs: [
          'The scene draws on demand instead of on a timer. Nothing in it moves by itself, so an idle scene asks the browser for nothing, and a hidden tab or a scrolled-away scene needs no special handling. The Renderer stats panel shows a frame count that stops rising when the scene is still.',
          'The camera is limited rather than free. It cannot go below the ground, look along it edge-on, or move so close or so far that the stage is lost. Panning is off because the stage is small and fixed. A plain mouse wheel scrolls the page, and Ctrl or ⌘ with the wheel zooms, so a scene in the middle of a page does not trap scrolling.',
          'Camera moves are also buttons, and solids are also a list. Dragging a canvas is not available from a keyboard or a screen reader, so every action the pointer can do has a control that can be focused and named. With reduced motion requested, the camera has no inertia and the Reset camera button jumps instead of flying.',
          'The colours come from the site’s theme tokens and are read again when the theme changes. Light is the same in both themes, so a solid keeps its shading.',
        ],
      },
      {
        heading: 'Lifecycle and fallbacks',
        paragraphs: [
          'Three.js is downloaded only in a browser that can create a WebGL2 context, and only by this page. The renderer is built once per mount: React’s double mount in development builds no second one. Leaving the page releases the geometries, materials, event listeners, and the graphics context, in that order, while the renderer can still free them.',
          'If the browser has no WebGL2, or the 3D code cannot be downloaded, or the renderer cannot start, the scene area says what happened and what to try. If the browser drops the graphics context the page says so, and the scene draws again when the context returns.',
        ],
      },
      {
        heading: 'Extending it',
        paragraphs: [
          'Everything in the scene comes from an ordered list of layers. A layer builds some objects, and may react to a theme change or a selection. The runtime owns drawing, picking, and disposal, so a layer needs no cleanup code. Adding building extrusions or terrain means writing one layer and appending it to the list; this release ships only the ground and the solids.',
          'A layer can rely on one unit being one metre, +Y being up, and the ground being at y = 0. Converting longitude and latitude to that local frame is the layer’s job, and the map projection experiment already holds the projection maths one might reuse.',
        ],
        code: {
          language: 'tsx',
          title: 'The shape of a layer',
          code: [
            'interface SceneLayer {',
            '  id: string',
            '  build(context: { palette: ScenePalette }): {',
            '    object: Object3D // added to the scene, disposed with it',
            '    pickables?: ReadonlyMap<Object3D, string> // what a click can select',
            '    setPalette?(palette: ScenePalette): void',
            '    setSelected?(id: string | null): void',
            '  }',
            '}',
          ].join('\n'),
        },
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
    description:
      '3D graphics experiments: a scene drawn with raw WebGL2 and no 3D library, and an interactive scene built with Three.js.',
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
