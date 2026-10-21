import {
  BufferGeometry,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  Texture,
  type Material,
  type Object3D,
} from 'three'
import { describe, expect, it } from 'vitest'

import type { ScenePalette } from '../theme-colors'
import { disposeObject3D } from './dispose'
import { LAYERS, buildScene } from './layers'

// A renderer frees a geometry's buffers or a material's program when it hears `dispose` from that
// object. Listening for the event checks what the renderer would be told, without a renderer.

const palette: ScenePalette = {
  background: '#ffffff',
  ground: '#eeeeee',
  grid: '#bbbbbb',
  solid: '#3355cc',
  selection: '#cc8800',
}

/** Counts `dispose` events per object, by listening on each of them. */
function watch(...objects: (BufferGeometry | Material | Texture)[]) {
  const counts = new Map<object, number>()
  for (const object of objects) {
    counts.set(object, 0)
    object.addEventListener('dispose', () => {
      counts.set(object, (counts.get(object) ?? 0) + 1)
    })
  }
  return counts
}

describe('disposeObject3D', () => {
  it('disposes every geometry and material of the shipped scene exactly once', () => {
    const { scene } = buildScene(LAYERS, palette)
    const things: (BufferGeometry | Material)[] = []
    scene.traverse((object) => {
      const drawn = object as Partial<Mesh<BufferGeometry, Material>>
      if (drawn.geometry) things.push(drawn.geometry)
      if (drawn.material) things.push(drawn.material)
    })
    const counts = watch(...things)
    expect(counts.size).toBe(14)

    disposeObject3D(scene)

    for (const [thing, count] of counts) expect(count, thing.constructor.name).toBe(1)
  })

  it('disposes a geometry or material that several meshes share only once', () => {
    const geometry = new BufferGeometry()
    const material = new MeshBasicMaterial()
    const root = new Group()
    root.add(new Mesh(geometry, material), new Mesh(geometry, material))
    const counts = watch(geometry, material)

    disposeObject3D(root)

    expect(counts.get(geometry)).toBe(1)
    expect(counts.get(material)).toBe(1)
  })

  it('reaches objects nested deep in the graph', () => {
    const geometry = new BufferGeometry()
    const material = new MeshBasicMaterial()
    const root = new Group()
    const inner = new Group()
    root.add(new Group().add(inner))
    inner.add(new Mesh(geometry, material))
    const counts = watch(geometry, material)

    disposeObject3D(root)

    expect(counts.get(geometry)).toBe(1)
    expect(counts.get(material)).toBe(1)
  })

  it('disposes each material of a mesh that has one per face group', () => {
    const materials = [new MeshBasicMaterial(), new MeshBasicMaterial()]
    const mesh = new Mesh(new BufferGeometry(), materials)
    const counts = watch(...materials)

    disposeObject3D(mesh)

    for (const material of materials) expect(counts.get(material)).toBe(1)
  })

  it('disposes lines and points as well as meshes', () => {
    const lineGeometry = new BufferGeometry()
    const lineMaterial = new LineBasicMaterial()
    const pointGeometry = new BufferGeometry()
    const pointMaterial = new PointsMaterial()
    const root = new Group()
    root.add(new Line(lineGeometry, lineMaterial), new Points(pointGeometry, pointMaterial))
    const counts = watch(lineGeometry, lineMaterial, pointGeometry, pointMaterial)

    disposeObject3D(root)

    for (const [thing, count] of counts) expect(count, thing.constructor.name).toBe(1)
  })

  it('disposes the textures a material holds, which a terrain layer would have', () => {
    const map = new Texture()
    const material = new MeshBasicMaterial({ map })
    const root = new Mesh(new BufferGeometry(), material)
    const counts = watch(map)

    disposeObject3D(root)

    expect(counts.get(map)).toBe(1)
  })

  it('disposes a texture shared by two materials once', () => {
    const map = new Texture()
    const root = new Group()
    root.add(
      new Mesh(new BufferGeometry(), new MeshBasicMaterial({ map })),
      new Mesh(new BufferGeometry(), new MeshBasicMaterial({ map })),
    )
    const counts = watch(map)

    disposeObject3D(root)

    expect(counts.get(map)).toBe(1)
  })

  it('leaves things that are not drawn alone', () => {
    const root: Object3D = new Group()
    expect(() => {
      disposeObject3D(root)
    }).not.toThrow()
  })
})
