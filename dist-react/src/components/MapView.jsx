import { useEffect, useEffectEvent, useRef, useState } from "react"
import { AttributionControl, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { CATEGORIES } from "../data/institutions.js"
import { AREA, ZOOM } from "../lib/area.js"

const BOUNDS = L.latLngBounds([AREA.south, AREA.west], [AREA.north, AREA.east])
const ROUTE_COLOR = "#2bb673"
const EXTERNAL = '<span class="sr-only"> (verlässt CivixX)</span>'
const ATTRIBUTION = `&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer" translate="no">OpenStreetMap${EXTERNAL}</a>-Mitwirkende`
const PREFIX = `<a href="https://leafletjs.com" rel="noopener noreferrer" translate="no">Leaflet${EXTERNAL}</a>`

const shapeIcons = selected => Object.fromEntries(Object.entries(CATEGORIES).map(([key, { shape }]) => [key, L.divIcon({
  className: `civix-pin ${selected ? "civix-pin-selected" : "civix-pin-institution"}`,
  html: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${shape}"/></svg>`,
  iconSize: selected ? [30, 30] : [20, 20],
  iconAnchor: selected ? [15, 15] : [10, 10]
})]))

const CATEGORY_ICONS = shapeIcons(false)
const SELECTED_ICONS = shapeIcons(true)
const dotIcon = kind => L.divIcon({ className: `civix-pin civix-pin-${kind}`, html: "<span></span>", iconSize: [20, 20], iconAnchor: [10, 10] })
const SEARCH_ICON = dotIcon("search")
const USER_ICON = dotIcon("user")

const round = (value, digits) => Math.round(value * 10 ** digits) / 10 ** digits
const currentView = map => {
  const { lat, lng } = map.getCenter()
  return { lat: round(lat, 5), lng: round(lng, 5), zoom: round(map.getZoom(), 2) }
}
const sameView = (a, b) => a.lat === b.lat && a.lng === b.lng && a.zoom === b.zoom

// URL-Ansicht hat Vorrang (Back/Forward, Deep-Link); sonst zum Ziel fliegen.
function ViewSync({ view, target, reducedMotion, onViewChange }) {
  const map = useMap()
  const viewKey = view && `${view.lat},${view.lng},${view.zoom}`

  // Nur bei neuem Ansichts-/Zielschlüssel bewegen, nicht bei jedem Render mit neuem Objekt.
  const sync = useEffectEvent(() => {
    if (view) {
      if (!sameView(currentView(map), view)) map.setView([view.lat, view.lng], view.zoom, { animate: !reducedMotion })
      return
    }
    if (!target) return
    const zoom = Math.max(map.getZoom(), target.zoom)
    if (reducedMotion) map.setView([target.lat, target.lng], zoom, { animate: false })
    else map.flyTo([target.lat, target.lng], zoom, { duration: .8 }) // Ziehen/Zoomen bricht den Flug ab
  })
  const targetKey = target?.key
  useEffect(() => sync(), [viewKey, targetKey, reducedMotion])

  useMapEvents({ moveend: () => onViewChange(currentView(map)) })
  return null
}

function MapEvents({ onMapClick }) {
  useMapEvents({ click: event => onMapClick({ lat: round(event.latlng.lat, 5), lng: round(event.latlng.lng, 5) }) })
  return null
}

// Kartencontainer ist per Tab erreichbar (Pfeiltasten/Plus/Minus); Name und Rolle ergänzen.
// Per Tab fokussierte Marker außerhalb des Ausschnitts in den sichtbaren Bereich holen.
function Accessibility({ reducedMotion }) {
  const map = useMap()
  const revealMarker = useEffectEvent(event => {
    if (!event.target.classList.contains("leaflet-marker-icon")) return
    map.eachLayer(layer => {
      if (layer.getElement?.() === event.target) map.panInside(layer.getLatLng(), { padding: [48, 48], animate: !reducedMotion })
    })
  })
  useEffect(() => {
    const container = map.getContainer()
    container.setAttribute("role", "region")
    container.setAttribute("aria-label", "Interaktive Karte. Pfeiltasten verschieben, Plus und Minus zoomen.")
    container.addEventListener("focusin", revealMarker)
    return () => container.removeEventListener("focusin", revealMarker)
  }, [map])
  return null
}

const enter = run => ({ click: run, keypress: event => { if (event.originalEvent.key === "Enter") run() } })

export default function MapView({ places, selected, search, start, route, view, target, reducedMotion, onSelect, onMapClick, onViewChange, onTileError }) {
  const [initial] = useState(() => view ?? target ?? null) // MapContainer liest center/zoom nur einmal
  const tileErrors = useRef(0)
  const countTileError = () => { if (++tileErrors.current === 3) onTileError() }

  return (
    <MapContainer
      center={initial ? [initial.lat, initial.lng] : [51.3397, 12.3731]}
      zoom={initial?.zoom ?? 12}
      minZoom={ZOOM.min} maxZoom={ZOOM.max} maxBounds={BOUNDS} maxBoundsViscosity={0.8}
      className="map" scrollWheelZoom zoomSnap={0.25} zoomDelta={0.5} wheelPxPerZoomLevel={180}
      zoomAnimation={!reducedMotion} fadeAnimation={!reducedMotion} markerZoomAnimation={!reducedMotion}
      attributionControl={false}
    >
      <AttributionControl prefix={PREFIX} />
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={ATTRIBUTION}
        eventHandlers={{ tileerror: countTileError }} />
      <Accessibility reducedMotion={reducedMotion} />
      <ViewSync view={view} target={target} reducedMotion={reducedMotion} onViewChange={onViewChange} />
      <MapEvents onMapClick={onMapClick} />
      {places.map(item => (
        <Marker key={item.id} position={[item.lat, item.lng]} icon={CATEGORY_ICONS[item.category]} title={`${item.name}, ${CATEGORIES[item.category]?.label}`} eventHandlers={enter(() => onSelect(item))}>
          <Popup><strong>{item.name}</strong><br />{item.address}</Popup>
        </Marker>
      ))}
      {selected && <Marker position={[selected.lat, selected.lng]} icon={SELECTED_ICONS[selected.category] || SEARCH_ICON} zIndexOffset={1000} keyboard={false} interactive={false} />}
      {start && <Marker position={[start.lat, start.lng]} icon={USER_ICON} title={start.label}><Popup>{start.label}</Popup></Marker>}
      {search?.position && <Marker position={[search.position.lat, search.position.lng]} icon={SEARCH_ICON} title={`Suchergebnis: ${search.query}`}><Popup>{search.query}</Popup></Marker>}
      {route && <Polyline positions={route.positions} pathOptions={{ color: ROUTE_COLOR, weight: 5, opacity: 1 }} interactive={false} />}
    </MapContainer>
  )
}
