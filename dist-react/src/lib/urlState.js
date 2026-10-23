import { inArea, ZOOM } from "./area.js"

// Query-Parameter sind die Quelle der Wahrheit für teilbaren Zustand.
// Der eigene Standort landet bewusst nie in der URL (Links werden geteilt).
export const PARAMS = { category: "kategorie", place: "ort", search: "suche", point: "punkt", start: "start", route: "route", view: "karte" }

const MAX_QUERY = 200

const parsePoint = text => {
  const parts = (text ?? "").split(",")
  if (parts.length !== 2) return null
  const [lat, lng] = parts.map(Number)
  return inArea({ lat, lng }) ? { lat, lng } : null
}

const parseView = text => {
  const parts = (text ?? "").split(",")
  if (parts.length !== 3) return null
  const point = parsePoint(parts.slice(0, 2).join(","))
  const zoom = Number(parts[2])
  return point && zoom >= ZOOM.min && zoom <= ZOOM.max ? { ...point, zoom } : null
}

const fixed = value => String(Math.round(value * 1e5) / 1e5)
const formatPoint = ({ lat, lng }) => `${fixed(lat)},${fixed(lng)}`

export const EMPTY_STATE = { category: "alle", placeId: null, search: null, start: null, route: false, view: null }

export function parseUrlState(params, { categories, placeIds }) {
  const category = params.get(PARAMS.category)
  const placeId = params.get(PARAMS.place)
  const query = (params.get(PARAMS.search) ?? "").trim().slice(0, MAX_QUERY)
  const validPlace = placeIds.has(placeId) ? placeId : null
  return {
    category: categories.includes(category) ? category : "alle",
    placeId: validPlace,
    search: query ? { query, position: parsePoint(params.get(PARAMS.point)) } : null,
    start: parsePoint(params.get(PARAMS.start)),
    route: Boolean(validPlace) && params.get(PARAMS.route) === "1",
    view: parseView(params.get(PARAMS.view))
  }
}

// Feste Reihenfolge, Standardwerte weglassen: gleiche Zustände ergeben gleiche URLs.
export function serializeUrlState(state) {
  const params = new URLSearchParams()
  if (state.category && state.category !== "alle") params.set(PARAMS.category, state.category)
  if (state.placeId) params.set(PARAMS.place, state.placeId)
  if (state.search?.query) {
    params.set(PARAMS.search, state.search.query)
    if (state.search.position) params.set(PARAMS.point, formatPoint(state.search.position))
  }
  if (state.start) params.set(PARAMS.start, formatPoint(state.start))
  if (state.route && state.placeId) params.set(PARAMS.route, "1")
  if (state.view) params.set(PARAMS.view, `${formatPoint(state.view)},${Math.round(state.view.zoom * 100) / 100}`)
  return params
}
