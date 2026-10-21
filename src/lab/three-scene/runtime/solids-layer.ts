import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
  type Object3D,
} from 'three'

import { SOLIDS, restingHeight, type Solid, type SolidShape } from '../scene-data'
import type { ScenePalette } from '../theme-colors'
import type { SceneLayer } from './layers'

/** Faces around a curved surface. Enough that the silhouette reads as round, few enough to stay cheap. */
const RADIAL_SEGMENTS = 48

function createGeometry(shape: SolidShape): BufferGeometry {
  switch (shape.kind) {
    case 'box':
      return new BoxGeometry(shape.width, shape.height, shape.depth)
    case 'cylinder':
      return new CylinderGeometry(shape.radius, shape.radius, shape.height, RADIAL_SEGMENTS)
    case 'cone':
      return new ConeGeometry(shape.radius, shape.height, RADIAL_SEGMENTS)
    case 'sphere':
      return new SphereGeometry(shape.radius, RADIAL_SEGMENTS, RADIAL_SEGMENTS / 2)
    case 'torus':
      return new TorusGeometry(shape.radius, shape.tube, RADIAL_SEGMENTS / 2, RADIAL_SEGMENTS)
  }
}

/** How strongly the selected solid glows in its own colour, so it reads in shadow as well as in light. */
const SELECTED_EMISSIVE = 0.35

function createMesh(
  solid: Solid,
  palette: ScenePalette,
): Mesh<BufferGeometry, MeshLambertMaterial> {
  // One material per solid, so selecting one recolours only that one.
  const mesh = new Mesh(
    createGeometry(solid.shape),
    new MeshLambertMaterial({ color: palette.solid }),
  )
  mesh.name = solid.id
  mesh.position.set(solid.position[0], restingHeight(solid.shape), solid.position[1])
  // TorusGeometry is drawn in the XY plane; turn it to lie flat on the ground.
  if (solid.shape.kind === 'torus') mesh.rotation.x = Math.PI / 2
  return mesh
}

/** The selectable solids, one mesh each. */
export const solidsLayer: SceneLayer = {
  id: 'solids',
  build(context) {
    let palette = context.palette
    let selected: string | null = null
    const meshes = SOLIDS.map((solid) => createMesh(solid, palette))
    const pickables = new Map<Object3D, string>(meshes.map((mesh) => [mesh, mesh.name]))
    const black = new Color(0x000000)

    function paint() {
      for (const mesh of meshes) {
        const isSelected = mesh.name === selected
        mesh.material.color.set(isSelected ? palette.selection : palette.solid)
        mesh.material.emissive.set(isSelected ? palette.selection : black)
        mesh.material.emissiveIntensity = isSelected ? SELECTED_EMISSIVE : 0
      }
    }

    const object = new Group()
    object.name = 'solids-layer'
    object.add(...meshes)

    return {
      object,
      pickables,
      setPalette(next) {
        palette = next
        paint()
      },
      setSelected(id) {
        selected = id
        paint()
      },
    }
  },
}
