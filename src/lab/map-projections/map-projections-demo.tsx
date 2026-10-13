import { useId, useMemo, useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { cities, type City } from './cities'
import { MapSvg } from './map-svg'
import {
  createOrthographic,
  equirectangular,
  horizontalScale,
  MERCATOR_MAX_LAT,
  webMercator,
  type Projection,
} from './projection'

type ProjectionId = 'equirectangular' | 'mercator' | 'orthographic'

function isProjectionId(value: string): value is ProjectionId {
  return value === 'equirectangular' || value === 'mercator' || value === 'orthographic'
}

function formatDegrees(value: number, positive: string, negative: string): string {
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? positive : negative}`
}

function RangeField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-xs text-muted-foreground">
          {value}°
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={5}
        value={value}
        onChange={(event) => {
          onChange(Number(event.target.value))
        }}
        className="w-full accent-primary focus-ring"
      />
    </div>
  )
}

interface CityTableProps {
  caption: string
  columnLabel: string
  describe: (city: City) => string
}

function CityTable({ caption, columnLabel, describe }: CityTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              City
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Latitude
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Longitude
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              {columnLabel}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {cities.map((city) => (
            <tr key={city.name}>
              <th scope="row" className="px-3 py-2 font-normal">
                {city.name}
              </th>
              <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                {formatDegrees(city.lat, 'N', 'S')}
              </td>
              <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                {formatDegrees(city.lon, 'E', 'W')}
              </td>
              <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{describe(city)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MapFigure({ projection, caption }: { projection: Projection; caption: string }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="mx-auto w-full max-w-2xl">
        <MapSvg
          projection={projection}
          cities={cities}
          showLabels
          title={`${projection.name} projection with a 30° graticule and ${String(cities.length)} cities`}
        />
      </div>
      <figcaption className="text-center text-sm text-pretty text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  )
}

const stretch = (city: City) => `×${horizontalScale(city.lat).toFixed(2)}`

/** Compare three projections of the same graticule and cities. */
export function MapProjectionsDemo() {
  const [active, setActive] = useState<ProjectionId>('orthographic')
  const [centerLon, setCenterLon] = useState(105)
  const [centerLat, setCenterLat] = useState(15)
  const orthographic = useMemo(
    () => createOrthographic(centerLon, centerLat),
    [centerLon, centerLat],
  )

  return (
    <Tabs
      variant="pill"
      value={active}
      onValueChange={(value) => {
        if (isProjectionId(value)) setActive(value)
      }}
      className="flex flex-col gap-4"
    >
      <TabsList aria-label="Projection" className="self-start">
        <TabsTrigger value="orthographic">Orthographic</TabsTrigger>
        <TabsTrigger value="mercator">Web Mercator</TabsTrigger>
        <TabsTrigger value="equirectangular">Equirectangular</TabsTrigger>
      </TabsList>

      <TabsContent value="orthographic" className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <RangeField
            label="Centre longitude"
            value={centerLon}
            min={-180}
            max={180}
            onChange={setCenterLon}
          />
          <RangeField
            label="Centre latitude"
            value={centerLat}
            min={-60}
            max={60}
            onChange={setCenterLat}
          />
        </div>
        <MapFigure
          projection={orthographic}
          caption="Only the hemisphere facing the viewer is drawn; points on the far side are culled."
        />
        <CityTable
          caption="Cities and whether they face the viewer"
          columnLabel="Visible"
          describe={(city) => (orthographic.project(city.lon, city.lat) ? 'Yes' : 'No')}
        />
      </TabsContent>

      <TabsContent value="mercator" className="flex flex-col gap-6">
        <MapFigure
          projection={webMercator}
          caption={`Parallels spread apart towards the poles; the map stops at ±${MERCATOR_MAX_LAT.toFixed(2)}° so it is square.`}
        />
        <CityTable
          caption="Cities and their Mercator scale factor"
          columnLabel="Scale vs. equator"
          describe={stretch}
        />
      </TabsContent>

      <TabsContent value="equirectangular" className="flex flex-col gap-6">
        <MapFigure
          projection={equirectangular}
          caption="Longitude and latitude map straight to x and y. Parallels stay evenly spaced, so shapes stretch east–west away from the equator."
        />
        <CityTable
          caption="Cities and their east–west stretch"
          columnLabel="East–west stretch"
          describe={stretch}
        />
      </TabsContent>
    </Tabs>
  )
}
