export interface City {
  name: string
  lon: number
  lat: number
}

/** Approximate city-centre coordinates in degrees. */
export const cities: readonly City[] = [
  { name: 'Hanoi', lon: 105.85, lat: 21.03 },
  { name: 'Singapore', lon: 103.82, lat: 1.35 },
  { name: 'Tokyo', lon: 139.69, lat: 35.68 },
  { name: 'Sydney', lon: 151.21, lat: -33.87 },
  { name: 'Nairobi', lon: 36.82, lat: -1.29 },
  { name: 'Cape Town', lon: 18.42, lat: -33.92 },
  { name: 'London', lon: -0.13, lat: 51.51 },
  { name: 'Reykjavík', lon: -21.94, lat: 64.15 },
  { name: 'New York', lon: -74.01, lat: 40.71 },
  { name: 'São Paulo', lon: -46.63, lat: -23.55 },
]
