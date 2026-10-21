import { Group, GridHelper, Mesh, MeshLambertMaterial, PlaneGeometry } from 'three'

import type { SceneLayer } from './layers'

/** Side of the square stage, in metres. The camera's farthest distance keeps all of it in view. */
const SIZE = 24

/** The stage: a plane to stand on and a one-metre grid on top of it. */
export const groundLayer: SceneLayer = {
  id: 'ground',
  build({ palette }) {
    const plane = new Mesh(
      new PlaneGeometry(SIZE, SIZE),
      new MeshLambertMaterial({ color: palette.ground }),
    )
    plane.rotation.x = -Math.PI / 2
    plane.name = 'ground'

    // Both colours are white so that the material's colour alone decides the line colour, which is
    // what lets a theme change recolour the grid without rebuilding its geometry.
    const grid = new GridHelper(SIZE, SIZE, 0xffffff, 0xffffff)
    grid.material.color.set(palette.grid)
    // A hair above the plane, so the two surfaces never fight over the same depth.
    grid.position.y = 0.01

    const object = new Group()
    object.name = 'ground-layer'
    object.add(plane, grid)

    return {
      object,
      setPalette(next) {
        plane.material.color.set(next.ground)
        grid.material.color.set(next.grid)
      },
    }
  },
}
