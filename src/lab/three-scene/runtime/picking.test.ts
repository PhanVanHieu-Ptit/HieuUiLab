import { PerspectiveCamera, Vector3, type Object3D } from 'three'
import { beforeAll, describe, expect, it } from 'vitest'

import { FAR, FOV_DEGREES, HOME_POSE, NEAR, TARGET, poseToPosition } from '../camera-config'
import { SOLIDS } from '../scene-data'
import type { ScenePalette } from '../theme-colors'
import { LAYERS, buildScene, type BuiltScene } from './layers'
import { pickAt } from './picking'

// A ray is cast from a camera in the pose the page starts in, against the real scene graph. None
// of this needs a renderer; it only needs the matrices that a first frame would have computed.

const palette: ScenePalette = {
  background: '#ffffff',
  ground: '#eeeeee',
  grid: '#bbbbbb',
  solid: '#3355cc',
  selection: '#cc8800',
}

let built: BuiltScene
let camera: PerspectiveCamera

beforeAll(() => {
  built = buildScene(LAYERS, palette)
  camera = new PerspectiveCamera(FOV_DEGREES, 1.2, NEAR, FAR)
  camera.position.set(...poseToPosition(HOME_POSE))
  camera.lookAt(...TARGET)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)
  built.scene.updateMatrixWorld(true)
})

/** Where a world-space point lands on the canvas, in normalised device coordinates. */
function toNdc(point: Vector3): readonly [number, number] {
  const ndc = point.clone().project(camera)
  return [ndc.x, ndc.y]
}

function worldPositionOf(object: Object3D): Vector3 {
  return object.getWorldPosition(new Vector3())
}

describe('pickAt', () => {
  it('picks the box at the middle of the canvas, because the camera looks at it', () => {
    expect(pickAt(0, 0, camera, built.pickables)).toBe('box')
  })

  it('picks each solid where it is drawn', () => {
    for (const solid of SOLIDS) {
      const mesh = [...built.pickables.keys()].find((object) => object.name === solid.id)
      if (!mesh) throw new Error(`No mesh for ${solid.id}`)
      const centre = worldPositionOf(mesh)
      // A ring has a hole in the middle, so aim at its tube instead.
      const aim =
        solid.shape.kind === 'torus' ? centre.add(new Vector3(solid.shape.radius, 0, 0)) : centre
      const [x, y] = toNdc(aim)
      expect(pickAt(x, y, camera, built.pickables), solid.id).toBe(solid.id)
    }
  })

  it('picks nothing on the open ground, in the sky, or through the hole of the ring', () => {
    expect(pickAt(0, -0.95, camera, built.pickables)).toBeNull()
    expect(pickAt(-0.95, 0.95, camera, built.pickables)).toBeNull()
    expect(pickAt(0.95, 0.95, camera, built.pickables)).toBeNull()
    const torus = [...built.pickables.keys()].find((object) => object.name === 'torus')
    if (!torus) throw new Error('No torus')
    const [x, y] = toNdc(worldPositionOf(torus))
    expect(pickAt(x, y, camera, built.pickables)).toBeNull()
  })

  it('picks nothing when there is nothing to pick', () => {
    expect(pickAt(0, 0, camera, new Map())).toBeNull()
  })

  it('picks the nearest of two solids on the same ray', () => {
    // From behind the box, the ray through the middle of the canvas meets the box first.
    const behind = new PerspectiveCamera(FOV_DEGREES, 1.2, NEAR, FAR)
    behind.position.set(0, 1, 14)
    behind.lookAt(...TARGET)
    behind.updateMatrixWorld(true)
    behind.updateProjectionMatrix()
    expect(pickAt(0, 0, behind, built.pickables)).toBe('box')
  })
})
