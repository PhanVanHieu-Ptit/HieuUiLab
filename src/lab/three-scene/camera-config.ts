/**
 * The camera, as numbers. A pose is a position on a sphere around a fixed target, in the same
 * convention as Three.js's `Spherical`: `polar` is measured down from +Y (0 looks straight down)
 * and `azimuth` is measured from +Z towards +X. Nothing here imports Three.js, so the limits, the
 * toolbar's steps, and the reset animation can be tested without WebGL.
 */

export interface CameraPose {
  /** Radians around the vertical axis. */
  readonly azimuth: number
  /** Radians down from straight above. */
  readonly polar: number
  /** Metres from the target. */
  readonly distance: number
}

/** What the camera looks at, and orbits. A little above the ground, near the middle of the box. */
export const TARGET = [0, 1, 0] as const

export const FOV_DEGREES = 45
export const NEAR = 0.1
export const FAR = 200

export const HOME_POSE: CameraPose = {
  azimuth: Math.PI / 5,
  polar: Math.PI / 3,
  distance: 17,
}

/**
 * The bounds the camera cannot leave. The largest polar angle stays short of the horizon, so the
 * camera never goes below the ground plane or looks along it edge-on.
 */
export const LIMITS = {
  minDistance: 7,
  maxDistance: 30,
  minPolar: 0.12,
  maxPolar: Math.PI / 2 - 0.06,
} as const

export type CameraMove = 'orbit-left' | 'orbit-right' | 'raise' | 'lower' | 'zoom-in' | 'zoom-out'

export const CAMERA_MOVES: readonly CameraMove[] = [
  'orbit-left',
  'orbit-right',
  'raise',
  'lower',
  'zoom-in',
  'zoom-out',
]

const AZIMUTH_STEP = Math.PI / 12
const POLAR_STEP = Math.PI / 18
const ZOOM_FACTOR = 0.8

/** How long the camera takes to fly to a pose when motion is allowed. */
export const FLIGHT_MS = 450

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function clampPose(pose: CameraPose): CameraPose {
  return {
    azimuth: pose.azimuth,
    polar: clamp(pose.polar, LIMITS.minPolar, LIMITS.maxPolar),
    distance: clamp(pose.distance, LIMITS.minDistance, LIMITS.maxDistance),
  }
}

/** The pose one toolbar press away from `pose`, within the limits. */
export function movePose(pose: CameraPose, move: CameraMove): CameraPose {
  switch (move) {
    case 'orbit-left':
      return clampPose({ ...pose, azimuth: pose.azimuth - AZIMUTH_STEP })
    case 'orbit-right':
      return clampPose({ ...pose, azimuth: pose.azimuth + AZIMUTH_STEP })
    case 'raise':
      return clampPose({ ...pose, polar: pose.polar - POLAR_STEP })
    case 'lower':
      return clampPose({ ...pose, polar: pose.polar + POLAR_STEP })
    case 'zoom-in':
      return clampPose({ ...pose, distance: pose.distance * ZOOM_FACTOR })
    case 'zoom-out':
      return clampPose({ ...pose, distance: pose.distance / ZOOM_FACTOR })
  }
}

export function easeOutCubic(t: number): number {
  const remaining = 1 - clamp(t, 0, 1)
  return 1 - remaining * remaining * remaining
}

/** Fraction of the way (0 to 1) through a flight that started at `start`, at time `now`. */
export function flightProgress(start: number, now: number): number {
  return clamp((now - start) / FLIGHT_MS, 0, 1)
}

/**
 * A pose between two, going the short way round the vertical axis. Both ends are returned exactly,
 * so a flight finishes on the pose it was asked for.
 */
export function lerpPose(from: CameraPose, to: CameraPose, t: number): CameraPose {
  if (t <= 0) return from
  if (t >= 1) return to
  const turn = Math.PI * 2
  const delta = ((((to.azimuth - from.azimuth) % turn) + turn + Math.PI) % turn) - Math.PI
  return {
    azimuth: from.azimuth + delta * t,
    polar: from.polar + (to.polar - from.polar) * t,
    distance: from.distance + (to.distance - from.distance) * t,
  }
}

export type Vec3 = readonly [x: number, y: number, z: number]

export function poseToPosition(pose: CameraPose): Vec3 {
  const horizontal = pose.distance * Math.sin(pose.polar)
  return [
    TARGET[0] + horizontal * Math.sin(pose.azimuth),
    TARGET[1] + pose.distance * Math.cos(pose.polar),
    TARGET[2] + horizontal * Math.cos(pose.azimuth),
  ]
}

export function poseFromPosition([x, y, z]: Vec3): CameraPose {
  const dx = x - TARGET[0]
  const dy = y - TARGET[1]
  const dz = z - TARGET[2]
  const distance = Math.hypot(dx, dy, dz)
  return {
    azimuth: Math.atan2(dx, dz),
    polar: distance === 0 ? 0 : Math.acos(clamp(dy / distance, -1, 1)),
    distance,
  }
}
