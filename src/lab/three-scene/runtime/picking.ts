import { Raycaster, Vector2, type Camera, type Object3D } from 'three'

const raycaster = new Raycaster()
const ndc = new Vector2()

/**
 * The id of the nearest pickable under a point of the canvas, or null for empty space or the
 * ground. `x` and `y` are in normalised device coordinates: -1 to 1, with +y up.
 *
 * The ray uses each object's world matrix as it was at the last render. Call it after a frame has
 * been drawn, or update the matrices first when the scene has never been rendered.
 */
export function pickAt(
  x: number,
  y: number,
  camera: Camera,
  pickables: ReadonlyMap<Object3D, string>,
): string | null {
  ndc.set(x, y)
  raycaster.setFromCamera(ndc, camera)
  const [nearest] = raycaster.intersectObjects([...pickables.keys()], false)
  return nearest ? (pickables.get(nearest.object) ?? null) : null
}
