// Kartenausschnitt Leipzig ohne Leaflet-Abhängigkeit, damit Logik und Tests nicht das Karten-Bundle laden.
export const LEIPZIG = { lat: 51.3397, lng: 12.3731, zoom: 12 }
export const AREA = { south: 51.12, west: 12.0, north: 51.56, east: 12.75 }
export const ZOOM = { min: 10, max: 18 }

export const inArea = point =>
  Number.isFinite(point?.lat) && Number.isFinite(point?.lng) &&
  point.lat >= AREA.south && point.lat <= AREA.north && point.lng >= AREA.west && point.lng <= AREA.east
