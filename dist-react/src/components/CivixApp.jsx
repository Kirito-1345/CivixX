
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { useLocalStorage } from "../hooks/useLocalStorage.js"

const LEIPZIG = [51.3397, 12.3731]
const BOUNDS = L.latLngBounds([51.12, 12.00], [51.56, 12.75])
const SEARCH_ICON = L.divIcon({
  className: "civix-pin civix-pin-search",
  html: '<span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 18]
})
const USER_ICON = L.divIcon({
  className: "civix-pin civix-pin-user",
  html: '<span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 18]
})

function MapReady({ onReady }) {
  const map = useMap()
  useEffect(() => {
    map.whenReady(onReady)
  }, [map, onReady])
  return null
}

function SearchFlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target.position, target.zoom || 15, { duration: 2.5, easeLinearity: 0.35 })
  }, [map, target])
  return null
}

function ClickCapture({ onClick }) {
  useMapEvents({ click: event => onClick(event.latlng) })
  return null
}

export default function CivixApp() {
  const [query, setQuery] = useState("")
  const [routeStart, setRouteStart] = useState("")
  const [routeEnd, setRouteEnd] = useState("")
  const [routeBusy, setRouteBusy] = useState(false)
  const [routeLine, setRouteLine] = useState(null)
  const [search, setSearch] = useState(null)
  const [activeMarker, setActiveMarker] = useState(null)
  const [savedPlaces, setSavedPlaces] = useLocalStorage("civixx.savedPlaces", [])
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const abortRef = useRef(null)
  const cacheRef = useRef(new Map())

  useEffect(() => {
    try {
      const raw = localStorage.getItem("civixx.geocodeCache")
      const parsed = raw ? JSON.parse(raw) : {}
      Object.entries(parsed).forEach(([key, value]) => {
        if (value?.expires > Date.now()) cacheRef.current.set(key, value)
      })
    } catch {
      cacheRef.current = new Map()
    }
  }, [])

  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(""), 5000)
    return () => clearTimeout(timer)
  }, [status])

  const addSaved = useCallback(place => {
    setSavedPlaces(current => [...current, place])
    setStatus("Ort gemerkt.")
  }, [setSavedPlaces])

  const removeSaved = useCallback(index => {
    setSavedPlaces(current => current.filter((_, itemIndex) => index !== itemIndex))
  }, [setSavedPlaces])

  const geocode = useCallback(async address => {
    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("q", address)
    url.searchParams.set("format", "jsonv2")
    url.searchParams.set("limit", "1")
    url.searchParams.set("countrycodes", "de")
    url.searchParams.set("viewbox", `${BOUNDS.getWest()},${BOUNDS.getNorth()},${BOUNDS.getEast()},${BOUNDS.getSouth()}`)
    url.searchParams.set("bounded", "1")
    const cacheKey = url.searchParams.toString()
    const cached = cacheRef.current.get(cacheKey)
    if (cached?.expires > Date.now()) return cached.result

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const response = await fetch(url, { signal: abortRef.current.signal })
    if (!response.ok) throw new Error("network")
    const results = await response.json()
    const result = results[0] || null
    if (result) {
      const value = { result, expires: Date.now() + 86400000 }
      cacheRef.current.set(cacheKey, value)
      try {
        localStorage.setItem("civixx.geocodeCache", JSON.stringify(Object.fromEntries(cacheRef.current)))
      } catch {
        // Speicher kann im privaten Modus voll sein; die Suche funktioniert trotzdem.
      }
    }
    return result
  }, [])

  const submitSearch = useCallback(async address => {
    const value = address.trim()
    if (!value) return
    setBusy(true)
    try {
      const result = await geocode(value)
      if (!result) {
        setStatus("Es wurde keine passende Adresse gefunden.")
        return
      }
      const position = [Number.parseFloat(result.lat), Number.parseFloat(result.lon)]
      if (!BOUNDS.contains(position)) {
        setStatus("Diese Adresse liegt außerhalb des unterstützten Bereichs.")
        return
      }
      setSearch({ position, zoom: 16 })
      setActiveMarker({ position, title: result.display_name })
      setStatus("Adresse gefunden.")
    } catch (error) {
      if (error.name !== "AbortError") setStatus("Die Suche ist fehlgeschlagen. Bitte später erneut versuchen.")
    } finally {
      setBusy(false)
    }
  }, [geocode])

  const handleSubmit = event => {
    event.preventDefault()
    submitSearch(query)
  }

  const showLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Dein Browser unterstützt die Standortbestimmung nicht.")
      return
    }
    navigator.geolocation.getCurrentPosition(location => {
      const { latitude, longitude } = location.coords
      const position = [latitude, longitude]
      if (!BOUNDS.contains(position)) {
        setStatus("Dein Standort liegt außerhalb des unterstützten Bereichs.")
        return
      }
      setSearch({ position, zoom: 15 })
      setActiveMarker({ position, title: "Mein Standort" })
      setStatus("Standort gefunden.")
    }, () => setStatus("Standort konnte nicht ermittelt werden."), {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    })
  }

  const generateRoute = async event => {
    event.preventDefault()
    const start = routeStart.trim()
    const end = routeEnd.trim()
    if (!start || !end) {
      setStatus("Bitte Start und Ziel eingeben.")
      return
    }

    setRouteBusy(true)
    setRouteLine(null)
    try {
      const [startResult, endResult] = await Promise.all([geocode(start), geocode(end)])
      if (!startResult || !endResult) {
        setStatus("Start oder Ziel konnte nicht gefunden werden.")
        return
      }

      const startPosition = [Number.parseFloat(startResult.lat), Number.parseFloat(startResult.lon)]
      const endPosition = [Number.parseFloat(endResult.lat), Number.parseFloat(endResult.lon)]
      if (!BOUNDS.contains(startPosition) || !BOUNDS.contains(endPosition)) {
        setStatus("Start oder Ziel liegt außerhalb des unterstützten Bereichs.")
        return
      }

      const url = `https://router.project-osrm.org/route/v1/driving/${startPosition[1]},${startPosition[0]};${endPosition[1]},${endPosition[0]}?overview=full&geometries=geojson`
      const response = await fetch(url)
      if (!response.ok) throw new Error("network")
      const data = await response.json()
      if (data.code !== "Ok" || !data.routes?.length) {
        setStatus("Keine Route gefunden.")
        return
      }

      const positions = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon])
      setRouteLine(positions)
      setSearch({ position: startPosition, zoom: 13 })
      setActiveMarker({ position: startPosition, title: startResult.display_name })
      setStatus("Route generiert.")
    } catch {
      setStatus("Route konnte nicht generiert werden. Bitte später erneut versuchen.")
    } finally {
      setRouteBusy(false)
    }
  }

  const savedMarkers = useMemo(() => savedPlaces.map((place, index) => ({ ...place, index })), [savedPlaces])

  return (
    <main>
      <section className="hero" id="karte">
          <div className="hero-top">
            <div>
              <p className="eyebrow">Bildung vor Ort</p>
              <h1>Finde Bildungseinrichtungen in Leipzig.</h1>
            </div>
            <p className="lead">Suche eine Adresse, nutze deinen Standort oder klicke direkt in die Karte. Deine gemerkten Orte bleiben lokal in deinem Browser gespeichert.</p>
            <div className="quick-stats" aria-label="Projektübersicht">
              <span>Interaktive Karte</span>
              <span>Adresssuche</span>
              <span>Lokale Merkliste</span>
            </div>
          </div>

          <div className="map-shell">
            <MapContainer center={LEIPZIG} zoom={12} minZoom={10} maxZoom={19} maxBounds={BOUNDS} maxBoundsViscosity={0.8} className="map" scrollWheelZoom>
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
              />
              <MapReady onReady={() => setMapReady(true)} />
              <SearchFlyTo target={search} />
              <ClickCapture onClick={latlng => {
                const position = [latlng.lat, latlng.lng]
                setActiveMarker({ position, title: `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}` })
                addSaved({ label: `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`, lat: latlng.lat, lng: latlng.lng })
              }} />
              {activeMarker && <Marker position={activeMarker.position} icon={activeMarker.title === "Mein Standort" ? USER_ICON : SEARCH_ICON}><Popup>{activeMarker.title}</Popup></Marker>}
              {savedMarkers.map(place => (
                <Marker key={`${place.index}-${place.label}`} position={[place.lat, place.lng]} icon={SEARCH_ICON} title={place.label} />
              ))}
              {routeLine && <Polyline positions={routeLine} pathOptions={{ color: "#087e78", weight: 5, opacity: 0.85 }} />}
            </MapContainer>
          </div>

          <div className="map-controls">
            <form onSubmit={handleSubmit} role="search">
                <label className="sr-only" htmlFor="address">Adresse suchen</label>
                <input id="address" value={query} onChange={event => setQuery(event.target.value)} placeholder="Adresse in Leipzig suchen" autoComplete="street-address" />
                <button type="submit" disabled={busy || !query.trim()}>{busy ? "Suche…" : "Suchen"}</button>
                <button className="secondary" type="button" onClick={showLocation}>Standort</button>
                <button className="secondary" type="button" aria-expanded={savedOpen} aria-controls="saved-panel" onClick={() => setSavedOpen(!savedOpen)}>
                  Gemerkt ({savedPlaces.length})
                </button>
            </form>
            <form className="route-form" onSubmit={generateRoute}>
                <label className="sr-only" htmlFor="route-start">Startpunkt</label>
                <input id="route-start" value={routeStart} onChange={event => setRouteStart(event.target.value)} placeholder="Start" />
                <label className="sr-only" htmlFor="route-end">Zielpunkt</label>
                <input id="route-end" value={routeEnd} onChange={event => setRouteEnd(event.target.value)} placeholder="Ziel" />
                <button type="submit" disabled={routeBusy}>{routeBusy ? "Route…" : "Route erstellen"}</button>
            </form>
            <p className={status ? "status active" : "status"} role="status" aria-live="polite">{status}</p>
          </div>

          {savedOpen && (
            <div className="saved-panel" id="saved-panel">
              {savedPlaces.length ? savedPlaces.map((place, index) => (
                <div className="saved-item" key={`${place.index}-${place.label}`}>
                  <button type="button" onClick={() => {
                    setSearch({ position: [place.lat, place.lng], zoom: 16 })
                    setActiveMarker({ position: [place.lat, place.lng], title: place.label })
                  }}>{place.label}</button>
                  <button className="remove" type="button" onClick={() => removeSaved(index)}>✕</button>
                </div>
              )) : <p>Noch keine Orte gemerkt.</p>}
            </div>
          )}
        </section>

        <section className="cards" id="hinweise">
          <article>
            <h2>Wie es funktioniert</h2>
            <p>Die Adresse wird über den öffentlichen Nominatim-Dienst gesucht. Ein Klick in die Karte setzt einen Merkpunkt.</p>
          </article>
          <article>
            <h2>Daten & Privatsphäre</h2>
            <p>Deine Merkliste bleibt im lokalen Browser-Speicher. Die Seite verwendet keine Cookies und kein Tracking.</p>
          </article>
          <article>
            <h2>Nützliche Links</h2>
            <p><a href="https://react.dev/learn" target="_blank" rel="noreferrer">React Learn</a> · <a href="https://react-leaflet.js.org/" target="_blank" rel="noreferrer">React Leaflet</a> · <a href="https://leafletjs.com/examples.html" target="_blank" rel="noreferrer">Leaflet Examples</a></p>
          </article>
        </section>
    </main>
  )
}
