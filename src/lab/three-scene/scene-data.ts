/**
 * What is in the scene, as plain data. The scene is built from this and the info panel reads from
 * it, so the panel never has to ask the renderer anything. Units are metres, +Y is up, and the
 * ground is at y = 0, which is the convention a later geospatial layer can rely on.
 */

export type SolidShape =
  | {
      readonly kind: 'box'
      readonly width: number
      readonly height: number
      readonly depth: number
    }
  | { readonly kind: 'cylinder'; readonly radius: number; readonly height: number }
  | { readonly kind: 'cone'; readonly radius: number; readonly height: number }
  | { readonly kind: 'sphere'; readonly radius: number }
  | { readonly kind: 'torus'; readonly radius: number; readonly tube: number }

export interface Solid {
  readonly id: string
  readonly name: string
  readonly description: string
  /** The Three.js geometry class that draws it. */
  readonly geometry: string
  readonly shape: SolidShape
  /** Where it stands on the ground: x east, z south. */
  readonly position: readonly [x: number, z: number]
}

export const SOLIDS: readonly Solid[] = [
  {
    id: 'box',
    name: 'Box',
    description: 'Six flat faces. It stands at the centre of the scene, where the camera looks.',
    geometry: 'BoxGeometry',
    shape: { kind: 'box', width: 2, height: 2, depth: 2 },
    position: [0, 0],
  },
  {
    id: 'cylinder',
    name: 'Cylinder',
    description: 'A curved side and two flat caps, approximated by a ring of narrow faces.',
    geometry: 'CylinderGeometry',
    shape: { kind: 'cylinder', radius: 1, height: 2.5 },
    position: [-4, -2],
  },
  {
    id: 'cone',
    name: 'Cone',
    description: 'A cylinder whose top radius shrinks to a point.',
    geometry: 'ConeGeometry',
    shape: { kind: 'cone', radius: 1.2, height: 3 },
    position: [4, -2.5],
  },
  {
    id: 'sphere',
    name: 'Sphere',
    description: 'Smooth shading across many small faces makes the faceted surface read as round.',
    geometry: 'SphereGeometry',
    shape: { kind: 'sphere', radius: 1.2 },
    position: [-3.5, 3.5],
  },
  {
    id: 'torus',
    name: 'Torus',
    description: 'A ring lying flat on the ground, the only solid with a hole through it.',
    geometry: 'TorusGeometry',
    shape: { kind: 'torus', radius: 1.2, tube: 0.45 },
    position: [3.5, 3.5],
  },
]

export function getSolid(id: string): Solid | undefined {
  return SOLIDS.find((solid) => solid.id === id)
}

/** Height of the solid's centre above the ground, so that its lowest point touches y = 0. */
export function restingHeight(shape: SolidShape): number {
  switch (shape.kind) {
    case 'box':
    case 'cylinder':
    case 'cone':
      return shape.height / 2
    case 'sphere':
      return shape.radius
    case 'torus':
      // The ring lies flat, so what touches the ground is the thickness of its tube.
      return shape.tube
  }
}

const trim = (value: number) => String(Number(value.toFixed(2)))

/** The measurements that define the shape, in the order a reader expects, for the info panel. */
export function describeShape(shape: SolidShape): string {
  switch (shape.kind) {
    case 'box':
      return `${trim(shape.width)} × ${trim(shape.height)} × ${trim(shape.depth)} m`
    case 'cylinder':
    case 'cone':
      return `radius ${trim(shape.radius)} m, height ${trim(shape.height)} m`
    case 'sphere':
      return `radius ${trim(shape.radius)} m`
    case 'torus':
      return `ring radius ${trim(shape.radius)} m, tube radius ${trim(shape.tube)} m`
  }
}
