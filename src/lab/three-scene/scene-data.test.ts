import { describe, expect, it } from 'vitest'

import { SOLIDS, describeShape, getSolid, restingHeight } from './scene-data'

describe('the solids', () => {
  it('has unique ids and names', () => {
    expect(new Set(SOLIDS.map((solid) => solid.id)).size).toBe(SOLIDS.length)
    expect(new Set(SOLIDS.map((solid) => solid.name)).size).toBe(SOLIDS.length)
  })

  it('puts a box at the origin, where the camera looks, so the middle of the canvas hits it', () => {
    expect(getSolid('box')?.position).toEqual([0, 0])
  })

  it('keeps every solid on the stage and clear of the others', () => {
    for (const solid of SOLIDS) {
      expect(Math.abs(solid.position[0]), solid.id).toBeLessThan(12)
      expect(Math.abs(solid.position[1]), solid.id).toBeLessThan(12)
    }
    for (const [index, a] of SOLIDS.entries()) {
      for (const b of SOLIDS.slice(index + 1)) {
        const gap = Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1])
        expect(gap, `${a.id} and ${b.id}`).toBeGreaterThan(3)
      }
    }
  })

  it('looks a solid up by id', () => {
    expect(getSolid('cone')?.name).toBe('Cone')
    expect(getSolid('nothing')).toBeUndefined()
  })
})

describe('restingHeight', () => {
  it('lifts each shape so that its lowest point touches the ground', () => {
    expect(restingHeight({ kind: 'box', width: 2, height: 3, depth: 2 })).toBe(1.5)
    expect(restingHeight({ kind: 'cylinder', radius: 1, height: 2.5 })).toBe(1.25)
    expect(restingHeight({ kind: 'cone', radius: 1, height: 3 })).toBe(1.5)
    expect(restingHeight({ kind: 'sphere', radius: 1.2 })).toBe(1.2)
  })

  it('rests a torus on the thickness of its tube, because it lies flat', () => {
    expect(restingHeight({ kind: 'torus', radius: 1.2, tube: 0.45 })).toBe(0.45)
  })
})

describe('describeShape', () => {
  it('names the measurements in a form a reader expects', () => {
    expect(describeShape({ kind: 'box', width: 2, height: 2, depth: 2 })).toBe('2 × 2 × 2 m')
    expect(describeShape({ kind: 'cylinder', radius: 1, height: 2.5 })).toBe(
      'radius 1 m, height 2.5 m',
    )
    expect(describeShape({ kind: 'sphere', radius: 1.2 })).toBe('radius 1.2 m')
    expect(describeShape({ kind: 'torus', radius: 1.2, tube: 0.45 })).toBe(
      'ring radius 1.2 m, tube radius 0.45 m',
    )
  })
})
