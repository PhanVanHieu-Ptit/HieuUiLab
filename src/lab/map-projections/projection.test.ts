import { describe, expect, it } from 'vitest'

import {
  createOrthographic,
  equirectangular,
  graticule,
  horizontalScale,
  linePath,
  MERCATOR_MAX_LAT,
  webMercator,
} from './projection'

describe('equirectangular', () => {
  it('maps degrees straight to x and an upward y', () => {
    expect(equirectangular.project(105, 21)).toEqual([105, -21])
  })
})

describe('webMercator', () => {
  it('keeps the equator on y = 0 and longitude on x', () => {
    const [x, y] = webMercator.project(-74, 0) ?? [NaN, NaN]
    expect(x).toBe(-74)
    expect(y).toBeCloseTo(0, 10)
  })

  it('is square at the latitude limit and clamps beyond it', () => {
    expect(MERCATOR_MAX_LAT).toBeCloseTo(85.0511, 4)
    expect(webMercator.project(0, MERCATOR_MAX_LAT)?.[1]).toBeCloseTo(-180, 6)
    expect(webMercator.project(0, 89.9)).toEqual(webMercator.project(0, MERCATOR_MAX_LAT))
    expect(webMercator.project(0, -90)?.[1]).toBeCloseTo(180, 6)
  })

  it('stretches parallels towards the poles', () => {
    const at = (lat: number) => -(webMercator.project(0, lat)?.[1] ?? 0)
    expect(at(60) - at(30)).toBeGreaterThan(at(30) - at(0))
  })
})

describe('orthographic', () => {
  it('puts the centre at the origin and the horizon on the radius', () => {
    const globe = createOrthographic(105, 15)
    const [cx, cy] = globe.project(105, 15) ?? [NaN, NaN]
    expect(cx).toBeCloseTo(0, 10)
    expect(cy).toBeCloseTo(0, 10)

    const equatorial = createOrthographic(0, 0)
    expect(equatorial.project(90, 0)?.[0]).toBeCloseTo(90, 10)
  })

  it('culls the far side of the globe', () => {
    const globe = createOrthographic(0, 0)
    expect(globe.project(180, 0)).toBeNull()
    expect(globe.project(-120, 10)).toBeNull()
    expect(globe.project(45, 10)).not.toBeNull()
  })
})

describe('helpers', () => {
  it('returns sec(latitude) as the east–west scale', () => {
    expect(horizontalScale(0)).toBe(1)
    expect(horizontalScale(60)).toBeCloseTo(2, 10)
  })

  it('builds meridians and parallels every 30° by default', () => {
    // 13 meridians (-180…180) and 5 parallels (-60…60).
    expect(graticule()).toHaveLength(18)
  })

  it('splits paths where points are hidden', () => {
    const globe = createOrthographic(0, 0)
    const equator = graticule(30, 10).find((line) => line.every(([, lat]) => lat === 0)) ?? []
    const path = linePath(globe, equator)
    expect(path.startsWith('M')).toBe(true)
    // The visible half is one segment; the hidden half produces no commands.
    expect(path.match(/M/g)).toHaveLength(1)
    expect(
      linePath(equirectangular, [
        [0, 0],
        [10, 10],
      ]),
    ).toBe('M0 0L10 -10')
  })
})
