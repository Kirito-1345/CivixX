import { AREA, inArea } from "./area.js"
import { createCache } from "./cache.js"
import { normalize } from "./places.js"

export class ServiceError extends Error {
  constructor(kind, status) {
    super(kind)
    this.name = "ServiceError"
    this.kind = kind // offline | network | rate-limit | server | no-route
    this.status = status
  }
}

const storageOrNull = name => { try { return window[name] } catch { return null } }

const isPoint = value => inArea(value) && (value.label === undefined || typeof value.label === "string")
const isRoute = value => Array.isArray(value?.positions) && value.positions.length > 1 &&
  value.positions.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)) &&
  Number.isFinite(value.distance) && Number.isFinite(value.duration)

// Adressen: über Reloads hinweg (localStorage). Routen enthalten den Standort und bleiben deshalb nur
// bis zum Schließen des Tabs (sessionStorage).
export const geocodeCache = createCache({ storage: storageOrNull("localStorage"), key: "civixx.cache.geocode", ttl: 7 * 86400000, max: 50, validate: value => value === null || isPoint(value) })
export const routeCache = createCache({ storage: storageOrNull("sessionStorage"), key: "civixx.cache.route", ttl: 3600000, max: 20, validate: isRoute })

async function getJson(url, signal) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) throw new ServiceError("offline")
  let response
  try {
    response = await fetch(url, { signal, headers: { Accept: "application/json" } })
  } catch (error) {
    if (error?.name === "AbortError") throw error
    throw new ServiceError("network")
  }
  if (response.status === 429) throw new ServiceError("rate-limit", 429)
  if (!response.ok) throw new ServiceError("server", response.status)
  try { return await response.json() } catch { throw new ServiceError("server", response.status) }
}

const round = value => Math.round(value * 1e5) / 1e5

export async function geocode(query, { signal, cache = geocodeCache } = {}) {
  const cacheKey = normalize(query.trim()).slice(0, 200)
  const cached = cache.get(cacheKey)
  if (cached !== undefined) return cached

  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", `${query.trim()}, Leipzig`)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "1")
  url.searchParams.set("countrycodes", "de")
  url.searchParams.set("viewbox", `${AREA.west},${AREA.north},${AREA.east},${AREA.south}`)
  url.searchParams.set("bounded", "1")
  const data = await getJson(url, signal)
  const [hit] = Array.isArray(data) ? data : []
  const point = hit ? { lat: round(Number.parseFloat(hit.lat)), lng: round(Number.parseFloat(hit.lon)), label: String(hit.display_name ?? "") } : null
  const result = point && inArea(point) ? point : null
  cache.set(cacheKey, result) // auch „nicht gefunden“ merken, das spart wiederholte Anfragen
  return result
}

export async function fetchRoute(start, destination, { signal, cache = routeCache } = {}) {
  const coordinates = `${round(start.lng)},${round(start.lat)};${round(destination.lng)},${round(destination.lat)}`
  const cached = cache.get(coordinates)
  if (cached) return cached

  const data = await getJson(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`, signal)
  const [best] = data?.code === "Ok" && Array.isArray(data.routes) ? data.routes : []
  const result = best && {
    positions: (best.geometry?.coordinates ?? []).map(([lng, lat]) => [lat, lng]),
    distance: best.distance,
    duration: best.duration
  }
  if (!result || !isRoute(result)) throw new ServiceError("no-route")
  cache.set(coordinates, result)
  return result
}
