export const CAMPUS_BOUNDS = {
  north: 22.3280,
  south: 22.3050,
  east: 87.3185,
  west: 87.2950,
}

export const CAMPUS_BOUNDS_ARRAY: [[number, number], [number, number]] = [
  [CAMPUS_BOUNDS.south, CAMPUS_BOUNDS.west],
  [CAMPUS_BOUNDS.north, CAMPUS_BOUNDS.east],
]

export function isWithinCampus(lat: number, lng: number): boolean {
  return (
    lat >= CAMPUS_BOUNDS.south &&
    lat <= CAMPUS_BOUNDS.north &&
    lng >= CAMPUS_BOUNDS.west &&
    lng <= CAMPUS_BOUNDS.east
  )
}
