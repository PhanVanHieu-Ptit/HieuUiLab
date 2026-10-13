/** A point in a projection's own coordinate space; y grows downwards like SVG. */
export type Point = readonly [x: number, y: number]
/** Longitude, latitude in degrees. */
export type LonLat = readonly [lon: number, lat: number]

export interface Projection {
  id: string
  name: string
  /** SVG viewBox covering the whole projected world. */
  viewBox: readonly [x: number, y: number, width: number, height: number]
  outline: 'rect' | 'circle'
  /** Projected point, or null when the location is not visible in this projection. */
  project: (lon: number, lat: number) => Point | null
}

const RAD = Math.PI / 180
const DEG = 180 / Math.PI

/** Web Mercator stops here: the latitude at which the projected world is square. */
export const MERCATOR_MAX_LAT = Math.atan(Math.sinh(Math.PI)) * DEG

export const equirectangular: Projection = {
  id: 'equirectangular',
  name: 'Equirectangular',
  viewBox: [-180, -90, 360, 180],
  outline: 'rect',
  project: (lon, lat) => [lon, -lat],
}

export const webMercator: Projection = {
  id: 'mercator',
  name: 'Web Mercator',
  viewBox: [-180, -180, 360, 360],
  outline: 'rect',
  project: (lon, lat) => {
    const clamped = Math.max(-MERCATOR_MAX_LAT, Math.min(MERCATOR_MAX_LAT, lat))
    const y = Math.log(Math.tan(Math.PI / 4 + (clamped * RAD) / 2)) * DEG
    return [lon, -y]
  },
}

/** A globe seen from far away, centred on `[centerLon, centerLat]`; radius 90. */
export function createOrthographic(centerLon: number, centerLat: number): Projection {
  const phi0 = centerLat * RAD
  const sinPhi0 = Math.sin(phi0)
  const cosPhi0 = Math.cos(phi0)
  const radius = 90

  return {
    id: 'orthographic',
    name: 'Orthographic',
    viewBox: [-radius, -radius, radius * 2, radius * 2],
    outline: 'circle',
    project: (lon, lat) => {
      const phi = lat * RAD
      const dLambda = (lon - centerLon) * RAD
      const cosPhi = Math.cos(phi)
      // Cosine of the angular distance from the centre; negative means the far side.
      const cosC = sinPhi0 * Math.sin(phi) + cosPhi0 * cosPhi * Math.cos(dLambda)
      if (cosC < 0) return null
      const x = radius * cosPhi * Math.sin(dLambda)
      const y = radius * (cosPhi0 * Math.sin(phi) - sinPhi0 * cosPhi * Math.cos(dLambda))
      return [x, -y]
    },
  }
}

/** East–west scale relative to the equator for cylindrical projections: sec(lat). */
export function horizontalScale(lat: number): number {
  return 1 / Math.cos(lat * RAD)
}

/** Meridians and parallels every `step` degrees, sampled every `resolution` degrees. */
export function graticule(step = 30, resolution = 2): LonLat[][] {
  const lines: LonLat[][] = []
  for (let lon = -180; lon <= 180; lon += step) {
    const line: LonLat[] = []
    for (let lat = -90; lat <= 90; lat += resolution) line.push([lon, lat])
    lines.push(line)
  }
  for (let lat = -90 + step; lat < 90; lat += step) {
    const line: LonLat[] = []
    for (let lon = -180; lon <= 180; lon += resolution) line.push([lon, lat])
    lines.push(line)
  }
  return lines
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

/** SVG path data for a line; hidden points split it into separate segments. */
export function linePath(projection: Projection, line: readonly LonLat[]): string {
  let path = ''
  let drawing = false
  for (const [lon, lat] of line) {
    const point = projection.project(lon, lat)
    if (!point) {
      drawing = false
      continue
    }
    path += `${drawing ? 'L' : 'M'}${String(round(point[0]))} ${String(round(point[1]))}`
    drawing = true
  }
  return path
}
