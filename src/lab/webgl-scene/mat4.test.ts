import { describe, expect, it } from 'vitest'

import {
  identity,
  multiply,
  perspective,
  rotationX,
  rotationY,
  transformPoint,
  translation,
} from './mat4'

function expectPoint(actual: readonly number[], expected: readonly number[]) {
  expected.forEach((value, index) => {
    expect(actual[index]).toBeCloseTo(value, 6)
  })
}

describe('mat4', () => {
  it('leaves points unchanged under identity', () => {
    expectPoint(transformPoint(identity(), [1, 2, 3]), [1, 2, 3])
  })

  it('applies the right-hand matrix first', () => {
    const moveThenTurn = multiply(rotationY(Math.PI / 2), translation(1, 0, 0))
    // Translate (0,0,0) to (1,0,0), then rotate 90° about Y to (0,0,-1).
    expectPoint(transformPoint(moveThenTurn, [0, 0, 0]), [0, 0, -1])
  })

  it('rotates about X counter-clockwise', () => {
    expectPoint(transformPoint(rotationX(Math.PI / 2), [0, 1, 0]), [0, 0, 1])
  })

  it('maps the near and far planes to -1 and 1', () => {
    const projection = perspective(Math.PI / 2, 1, 1, 10)
    expect(transformPoint(projection, [0, 0, -1])[2]).toBeCloseTo(-1, 6)
    expect(transformPoint(projection, [0, 0, -10])[2]).toBeCloseTo(1, 6)
  })

  it('divides by aspect ratio horizontally', () => {
    const wide = perspective(Math.PI / 2, 2, 1, 10)
    expectPoint(transformPoint(wide, [1, 1, -1]), [0.5, 1, -1])
  })
})
