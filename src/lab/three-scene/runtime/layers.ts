import { Color, DirectionalLight, HemisphereLight, Scene, type Object3D } from 'three'

import type { ScenePalette } from '../theme-colors'
import { groundLayer } from './ground-layer'
import { solidsLayer } from './solids-layer'

/**
 * Scene layers: the extension point of this experiment.
 *
 * Everything in the scene comes from an ordered list of layers. A layer builds some objects and,
 * if it wants, answers to a palette change, a selection, and clicks. The runtime owns the rest:
 * drawing, picking, theme changes, and disposing every geometry, material, and texture a layer
 * created, so a layer needs no cleanup code of its own.
 *
 * To add one, say building extrusions from footprints or a terrain mesh from an elevation grid,
 * write a `SceneLayer` and append it to `LAYERS`. Nothing else in the runtime changes.
 *
 * Conventions a geospatial layer can rely on: one unit is one metre, +Y is up, the ground is at
 * y = 0, and the origin is the centre of the scene (x east, z south). Converting longitude and
 * latitude to that local frame belongs to the layer or its data, not to the runtime.
 */

export interface LayerContext {
  readonly palette: ScenePalette
}

export interface LayerInstance {
  /** Added to the scene. Disposed with it. */
  readonly object: Object3D
  /** Objects a click can select, each mapped to the id it stands for. */
  readonly pickables?: ReadonlyMap<Object3D, string>
  setPalette?: (palette: ScenePalette) => void
  /** The id of the selected thing (or null). Called for every layer, whoever owns the id. */
  setSelected?: (id: string | null) => void
}

export interface SceneLayer {
  readonly id: string
  build: (context: LayerContext) => LayerInstance
}

/** Back to front. */
export const LAYERS: readonly SceneLayer[] = [groundLayer, solidsLayer]

export interface BuiltScene {
  readonly scene: Scene
  /** Every pickable object of every layer. */
  readonly pickables: ReadonlyMap<Object3D, string>
  setPalette: (palette: ScenePalette) => void
  setSelected: (id: string | null) => void
}

/** Light is the same in both themes, so a recoloured solid keeps the same shading. */
function addLights(scene: Scene) {
  scene.add(new HemisphereLight(0xffffff, 0x8f96a3, 1.4))
  const sun = new DirectionalLight(0xffffff, 2.4)
  sun.position.set(8, 14, 6)
  scene.add(sun)
}

export function buildScene(layers: readonly SceneLayer[], palette: ScenePalette): BuiltScene {
  const scene = new Scene()
  const background = new Color(palette.background)
  scene.background = background
  addLights(scene)

  const instances = layers.map((layer) => layer.build({ palette }))
  const pickables = new Map<Object3D, string>()
  for (const instance of instances) {
    scene.add(instance.object)
    for (const [object, id] of instance.pickables ?? []) pickables.set(object, id)
  }

  return {
    scene,
    pickables,
    setPalette(next) {
      background.set(next.background)
      for (const instance of instances) instance.setPalette?.(next)
    },
    setSelected(id) {
      for (const instance of instances) instance.setSelected?.(id)
    },
  }
}
