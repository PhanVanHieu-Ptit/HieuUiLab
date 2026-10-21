import { describe, expect, it } from 'vitest'

import {
  CAMERA_MOVES,
  FLIGHT_MS,
  HOME_POSE,
  LIMITS,
  clampPose,
  easeOutCubic,
  flightProgress,
  lerpPose,
  movePose,
  poseFromPosition,
  poseToPosition,
  type CameraPose,
} from './camera-config'

const inside = (pose: CameraPose) =>
  pose.polar >= LIMITS.minPolar &&
  pose.polar <= LIMITS.maxPolar &&
  pose.distance >= LIMITS.minDistance &&
  pose.distance <= LIMITS.maxDistance

describe('the home pose', () => {
  it('is inside the limits', () => {
    expect(inside(HOME_POSE)).toBe(true)
  })

  it('keeps the camera above the ground', () => {
    const [, y] = poseToPosition(HOME_POSE)
    expect(y).toBeGreaterThan(0)
  })
})

describe('the limits', () => {
  it('keep the camera short of the horizon, so it cannot go below the ground', () => {
    expect(LIMITS.maxPolar).toBeLessThan(Math.PI / 2)
    expect(LIMITS.minPolar).toBeGreaterThan(0)
    const lowest = poseToPosition({
      azimuth: 0,
      polar: LIMITS.maxPolar,
      distance: LIMITS.maxDistance,
    })
    expect(lowest[1]).toBeGreaterThan(0)
  })
})

describe('clampPose', () => {
  it('pulls every out-of-range value back to its bound and leaves the azimuth alone', () => {
    expect(clampPose({ azimuth: 9, polar: -1, distance: 1 })).toEqual({
      azimuth: 9,
      polar: LIMITS.minPolar,
      distance: LIMITS.minDistance,
    })
    expect(clampPose({ azimuth: 0, polar: 3, distance: 500 })).toEqual({
      azimuth: 0,
      polar: LIMITS.maxPolar,
      distance: LIMITS.maxDistance,
    })
  })

  it('returns an in-range pose unchanged', () => {
    expect(clampPose(HOME_POSE)).toEqual(HOME_POSE)
  })
})

describe('movePose', () => {
  it('moves each way a step in the direction its name says', () => {
    const left = movePose(HOME_POSE, 'orbit-left')
    const right = movePose(HOME_POSE, 'orbit-right')
    expect(left.azimuth).toBeLessThan(HOME_POSE.azimuth)
    expect(right.azimuth).toBeGreaterThan(HOME_POSE.azimuth)
    expect(movePose(HOME_POSE, 'raise').polar).toBeLessThan(HOME_POSE.polar)
    expect(movePose(HOME_POSE, 'lower').polar).toBeGreaterThan(HOME_POSE.polar)
    expect(movePose(HOME_POSE, 'zoom-in').distance).toBeLessThan(HOME_POSE.distance)
    expect(movePose(HOME_POSE, 'zoom-out').distance).toBeGreaterThan(HOME_POSE.distance)
  })

  it('only changes what the move is about', () => {
    expect(movePose(HOME_POSE, 'orbit-left')).toMatchObject({
      polar: HOME_POSE.polar,
      distance: HOME_POSE.distance,
    })
    expect(movePose(HOME_POSE, 'zoom-in')).toMatchObject({
      azimuth: HOME_POSE.azimuth,
      polar: HOME_POSE.polar,
    })
  })

  it('stops at the limits however many times it is pressed', () => {
    for (const move of CAMERA_MOVES) {
      let pose = HOME_POSE
      for (let press = 0; press < 80; press += 1) pose = movePose(pose, move)
      expect(inside(pose), move).toBe(true)
    }
    let closest = HOME_POSE
    for (let press = 0; press < 80; press += 1) closest = movePose(closest, 'zoom-in')
    expect(closest.distance).toBe(LIMITS.minDistance)
  })

  it('lets the azimuth go all the way round', () => {
    let pose = HOME_POSE
    for (let press = 0; press < 40; press += 1) pose = movePose(pose, 'orbit-right')
    expect(pose.azimuth).toBeGreaterThan(Math.PI * 2)
  })
})

describe('easing and flight progress', () => {
  it('eases out from 0 to 1 and never leaves that range', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
    expect(easeOutCubic(-4)).toBe(0)
    expect(easeOutCubic(7)).toBe(1)
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
  })

  it('measures progress from the flight’s start, across the whole flight and no further', () => {
    expect(flightProgress(1000, 1000)).toBe(0)
    expect(flightProgress(1000, 1000 + FLIGHT_MS / 2)).toBeCloseTo(0.5)
    expect(flightProgress(1000, 1000 + FLIGHT_MS)).toBe(1)
    expect(flightProgress(1000, 99_999)).toBe(1)
    expect(flightProgress(1000, 0)).toBe(0)
  })
})

describe('lerpPose', () => {
  const a: CameraPose = { azimuth: 0, polar: 1, distance: 10 }
  const b: CameraPose = { azimuth: 1, polar: 0.5, distance: 20 }

  it('returns both ends exactly, so a flight lands on the pose it was asked for', () => {
    expect(lerpPose(a, b, 0)).toBe(a)
    expect(lerpPose(a, b, 1)).toBe(b)
    expect(lerpPose(a, b, -3)).toBe(a)
    expect(lerpPose(a, b, 3)).toBe(b)
  })

  it('moves every part in proportion in between', () => {
    expect(lerpPose(a, b, 0.5)).toEqual({ azimuth: 0.5, polar: 0.75, distance: 15 })
  })

  it('turns the short way round the vertical axis', () => {
    const near = lerpPose(
      { azimuth: Math.PI - 0.1, polar: 1, distance: 10 },
      { azimuth: -Math.PI + 0.1, polar: 1, distance: 10 },
      0.5,
    )
    // Halfway across the seam is half a turn, not the long way back through zero.
    expect(Math.cos(near.azimuth)).toBeCloseTo(-1)
  })
})

describe('poses and positions', () => {
  it('round-trips through a position', () => {
    for (const pose of [HOME_POSE, { azimuth: -2, polar: 0.4, distance: 9 }]) {
      const back = poseFromPosition(poseToPosition(pose))
      expect(back.azimuth).toBeCloseTo(pose.azimuth)
      expect(back.polar).toBeCloseTo(pose.polar)
      expect(back.distance).toBeCloseTo(pose.distance)
    }
  })

  it('puts the camera at the stated distance from the target', () => {
    const [x, y, z] = poseToPosition({ azimuth: 1, polar: 1, distance: 12 })
    expect(Math.hypot(x, y - 1, z)).toBeCloseTo(12)
  })

  it('does not divide by zero when the camera sits on the target', () => {
    expect(poseFromPosition([0, 1, 0])).toEqual({ azimuth: 0, polar: 0, distance: 0 })
  })
})
