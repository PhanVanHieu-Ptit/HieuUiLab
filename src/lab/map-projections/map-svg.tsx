import { useMemo } from 'react'

import { cn } from '@/lib/cn'

import type { City } from './cities'
import { graticule, linePath, type Projection } from './projection'

const lines = graticule()

interface MapSvgProps {
  projection: Projection
  cities: readonly City[]
  /** Accessible name; omit to hide a purely decorative map. */
  title?: string
  showLabels?: boolean
  className?: string
}

/** Graticule and city markers drawn through any projection. */
export function MapSvg({ projection, cities, title, showLabels = false, className }: MapSvgProps) {
  const paths = useMemo(
    () => lines.map((line) => linePath(projection, line)).filter(Boolean),
    [projection],
  )
  const [x, y, width, height] = projection.viewBox
  const unit = width / 360

  return (
    <svg
      viewBox={`${String(x)} ${String(y)} ${String(width)} ${String(height)}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn('h-auto w-full', className)}
    >
      {projection.outline === 'circle' ? (
        <circle r={width / 2} className="fill-muted stroke-border" strokeWidth={unit} />
      ) : (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          className="fill-muted stroke-border"
          strokeWidth={unit}
        />
      )}
      <g className="fill-none stroke-muted-foreground/40" strokeWidth={unit * 0.6}>
        {paths.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </g>
      <g>
        {cities.map((city) => {
          const point = projection.project(city.lon, city.lat)
          if (!point) return null
          // Labels near the right edge go on the left of the marker so they stay inside the map.
          const labelLeft = point[0] > x + width * 0.7
          return (
            <g key={city.name} transform={`translate(${String(point[0])} ${String(point[1])})`}>
              <circle r={unit * 3} className="fill-primary stroke-background" strokeWidth={unit} />
              {showLabels ? (
                <text
                  x={labelLeft ? -unit * 5 : unit * 5}
                  y={unit * 3}
                  textAnchor={labelLeft ? 'end' : 'start'}
                  fontSize={unit * 9}
                  className="fill-foreground font-sans"
                >
                  {city.name}
                </text>
              ) : null}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
