import {
  Box3,
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Vector3,
  type Object3D,
  type Scene,
} from 'three'
import { describe, expect, it, vi } from 'vitest'

import { SOLIDS } from '../scene-data'
import type { ScenePalette } from '../theme-colors'
import { LAYERS, buildScene, type SceneLayer } from './layers'

// Three.js builds and measures a scene without WebGL, so these run against the real library.

const light: ScenePalette = {
  background: '#fafafa',
  ground: '#e0e0e0',
  grid: '#b0b0b0',
  solid: '#3355cc',
  selection: '#cc8800',
}
const dark: ScenePalette = {
  background: '#101010',
  ground: '#262626',
  grid: '#555555',
  solid: '#88aaff',
  selection: '#ffcc44',
}

function named(root: Object3D, name: string): Object3D {
  const found = root.getObjectByName(name)
  if (!found) throw new Error(`No object named ${name}`)
  return found
}

function materialOf(root: Object3D, name: string): MeshLambertMaterial {
  const found = named(root, name)
  if (!(found instanceof Mesh) || !(found.material instanceof MeshLambertMaterial)) {
    throw new Error(`${name} is not a Lambert mesh`)
  }
  return found.material
}

function backgroundOf(scene: Scene): string {
  if (!(scene.background instanceof Color)) throw new Error('The background is not a colour')
  return `#${scene.background.getHexString()}`
}

const hex = (color: Color) => `#${color.getHexString()}`

describe('buildScene with the shipped layers', () => {
  it('builds two lights, then the ground, then the solids', () => {
    const { scene } = buildScene(LAYERS, light)
    expect(scene.children.map((child) => child.name || child.type)).toEqual([
      'HemisphereLight',
      'DirectionalLight',
      'ground-layer',
      'solids-layer',
    ])
  })

  it('clears to the page background', () => {
    expect(backgroundOf(buildScene(LAYERS, light).scene)).toBe('#fafafa')
  })

  it('makes one pickable mesh per solid, named by its id, and the ground is not one of them', () => {
    const { scene, pickables } = buildScene(LAYERS, light)
    expect([...pickables.values()].sort()).toEqual(SOLIDS.map((solid) => solid.id).sort())
    for (const [object, id] of pickables) expect(object.name).toBe(id)
    expect(pickables.has(named(scene, 'ground'))).toBe(false)
  })

  it('stands every solid on the ground, touching it and not sinking into it', () => {
    const { scene } = buildScene(LAYERS, light)
    scene.updateMatrixWorld(true)
    for (const solid of SOLIDS) {
      const box = new Box3().setFromObject(named(scene, solid.id))
      expect(box.min.y, solid.id).toBeCloseTo(0, 6)
      expect(box.max.y, solid.id).toBeGreaterThan(0.5)
    }
  })

  it('lays the torus flat', () => {
    const { scene } = buildScene(LAYERS, light)
    scene.updateMatrixWorld(true)
    const size = new Box3().setFromObject(named(scene, 'torus')).getSize(new Vector3())
    expect(size.y).toBeLessThan(size.x / 2)
  })

  it('gives every solid a material of its own', () => {
    const { scene } = buildScene(LAYERS, light)
    const materials = new Set(SOLIDS.map((solid) => materialOf(scene, solid.id)))
    expect(materials.size).toBe(SOLIDS.length)
  })

  it('creates exactly the geometries and materials it should: five solids, a plane, and a grid', () => {
    const { scene } = buildScene(LAYERS, light)
    const geometries = new Set<unknown>()
    const materials = new Set<unknown>()
    scene.traverse((object) => {
      if (!(object instanceof Mesh) && !('geometry' in object)) return
      const drawn = object as Mesh
      geometries.add(drawn.geometry)
      materials.add(drawn.material)
    })
    expect(geometries.size).toBe(7)
    expect(materials.size).toBe(7)
  })
})

describe('selection', () => {
  it('colours only the selected solid, and makes it glow', () => {
    const { scene, setSelected } = buildScene(LAYERS, light)
    setSelected('cone')

    const cone = materialOf(scene, 'cone')
    expect(hex(cone.color)).toBe('#cc8800')
    expect(hex(cone.emissive)).toBe('#cc8800')
    expect(cone.emissiveIntensity).toBeGreaterThan(0)
    for (const solid of SOLIDS.filter((other) => other.id !== 'cone')) {
      const material = materialOf(scene, solid.id)
      expect(hex(material.color), solid.id).toBe('#3355cc')
      expect(material.emissiveIntensity, solid.id).toBe(0)
    }
  })

  it('moves with the selection and clears with it', () => {
    const { scene, setSelected } = buildScene(LAYERS, light)
    setSelected('cone')
    setSelected('sphere')
    expect(hex(materialOf(scene, 'cone').color)).toBe('#3355cc')
    expect(hex(materialOf(scene, 'sphere').color)).toBe('#cc8800')

    setSelected(null)
    for (const solid of SOLIDS) {
      expect(hex(materialOf(scene, solid.id).color), solid.id).toBe('#3355cc')
      expect(materialOf(scene, solid.id).emissiveIntensity, solid.id).toBe(0)
    }
  })

  it('ignores an id nothing has', () => {
    const { scene, setSelected } = buildScene(LAYERS, light)
    setSelected('missing')
    for (const solid of SOLIDS) {
      expect(hex(materialOf(scene, solid.id).color), solid.id).toBe('#3355cc')
    }
  })
})

describe('palette changes', () => {
  it('recolours the background, the stage, and the solids without building anything new', () => {
    const built = buildScene(LAYERS, light)
    const before: Object3D[] = []
    built.scene.traverse((object) => before.push(object))

    built.setPalette(dark)

    const after: Object3D[] = []
    built.scene.traverse((object) => after.push(object))
    expect(after).toEqual(before)
    expect(backgroundOf(built.scene)).toBe('#101010')
    expect(hex(materialOf(built.scene, 'ground').color)).toBe('#262626')
    expect(hex(materialOf(built.scene, 'box').color)).toBe('#88aaff')
  })

  it('keeps the selection, in the new selection colour', () => {
    const built = buildScene(LAYERS, light)
    built.setSelected('box')
    built.setPalette(dark)
    expect(hex(materialOf(built.scene, 'box').color)).toBe('#ffcc44')
    expect(hex(materialOf(built.scene, 'torus').color)).toBe('#88aaff')
  })
})

describe('adding a layer', () => {
  it('needs nothing but the layer: its objects are built, pickable, and told about selection and theme', () => {
    const setSelected = vi.fn()
    const setPalette = vi.fn()
    const marker = new Mesh(new BoxGeometry(), new MeshBasicMaterial())
    marker.name = 'marker'
    const extra: SceneLayer = {
      id: 'extra',
      build: ({ palette }) => {
        expect(palette).toBe(light)
        const object = new Group()
        object.add(marker)
        return { object, pickables: new Map([[marker, 'marker-1']]), setSelected, setPalette }
      },
    }

    const built = buildScene([...LAYERS, extra], light)
    expect(built.scene.getObjectByName('marker')).toBe(marker)
    expect(built.pickables.get(marker)).toBe('marker-1')
    expect(built.pickables.size).toBe(SOLIDS.length + 1)

    built.setSelected('marker-1')
    built.setPalette(dark)
    expect(setSelected).toHaveBeenCalledWith('marker-1')
    expect(setPalette).toHaveBeenCalledWith(dark)
  })

  it('tolerates a layer that reacts to nothing and offers nothing to click', () => {
    const quiet: SceneLayer = { id: 'quiet', build: () => ({ object: new Group() }) }
    const built = buildScene([quiet], light)
    expect(built.pickables.size).toBe(0)
    expect(() => {
      built.setSelected('x')
      built.setPalette(dark)
    }).not.toThrow()
  })
})
