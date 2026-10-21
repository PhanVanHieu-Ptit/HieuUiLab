import {
  Line,
  Mesh,
  Points,
  Texture,
  type BufferGeometry,
  type Material,
  type Object3D,
} from 'three'

type Drawable =
  | Mesh<BufferGeometry, Material | Material[]>
  | Line<BufferGeometry, Material | Material[]>
  | Points<BufferGeometry, Material | Material[]>

// Three.js types an `instanceof` match on these classes with `any` for geometry and material, so
// the guards name the types instead.
function isDrawable(object: Object3D): object is Drawable {
  return object instanceof Mesh || object instanceof Line || object instanceof Points
}

function isTexture(value: unknown): value is Texture {
  return value instanceof Texture
}

/**
 * Release the GPU memory behind everything under `root`: each geometry, material, and texture the
 * materials hold, once. The renderer does not do this when it is disposed, and a scene that is
 * only dropped keeps its buffers and shader programs alive until the context itself goes.
 *
 * Call it while the renderer still exists: `dispose` makes the renderer delete the objects.
 */
export function disposeObject3D(root: Object3D): void {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()

  root.traverse((object) => {
    if (!isDrawable(object)) return
    geometries.add(object.geometry)
    // A mesh may carry one material per face group.
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material)
    }
  })

  const textures = new Set<Texture>()
  for (const material of materials) {
    for (const value of Object.values(material as unknown as Record<string, unknown>)) {
      if (isTexture(value)) textures.add(value)
    }
  }

  for (const geometry of geometries) geometry.dispose()
  for (const material of materials) material.dispose()
  for (const texture of textures) texture.dispose()
}
