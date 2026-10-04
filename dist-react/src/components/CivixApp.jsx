
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet"
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
    if (target) map.flyTo(target.position, target.zoom || 15, { duration: 1.1 })
  }, [map, target])
  return null
}

function ClickCapture({ onClick }) {
  useMapEvents({ click: event => onClick(event.latlng) })
  return null
}

export default function CivixApp() {
  const [query, setQuery] = useState("")
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

  const savedMarkers = useMemo(() => savedPlaces.map((place, index) => ({ ...place, index })), [savedPlaces])

  return (
    <div className="page">
      <header className="site-header">
        <a className="brand" href="#karte">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"/><path d="M9 9h6M12 6v6"/></svg>
          </span>
          <span>
            <strong>CivixX</strong>
            <small>Leipzig entdecken</small>
          </span>
        </a>
        <nav className="header-nav" aria-label="Hauptnavigation">
          <a href="#karte">Karte</a>
          <a href="#hinweise">Hinweise</a>
          <a href="/privacy.html">Datenschutz</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="karte">
          <div className="hero-copy">
            <p className="eyebrow">Bildung vor Ort</p>
            <h1>Finde Bildungseinrichtungen in Leipzig.</h1>
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
            </MapContainer>

            <div className="control-panel">
              <p className="panel-title">Kartensteuerung</p>
              <form onSubmit={handleSubmit} role="search">
                <label className="sr-only" htmlFor="address">Adresse suchen</label>
                <input id="address" value={query} onChange={event => setQuery(event.target.value)} placeholder="Adresse in Leipzig suchen" autoComplete="street-address" />
                <button type="submit" disabled={busy || !query.trim()}>{busy ? "Suche…" : "Suchen"}</button>
              </form>
              <button className="secondary" type="button" onClick={showLocation}>◎ Meinen Standort zeigen</button>
              <button className="secondary" type="button" aria-expanded={savedOpen} aria-controls="saved-panel" onClick={() => setSavedOpen(!savedOpen)}>
                Gemerkte Orte ({savedPlaces.length})
              </button>
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
              <p className={status ? "status active" : "status"} role="status" aria-live="polite">{status}</p>
            </div>
            {!mapReady && <div className="map-loading">Karte wird geladen…</div>}
          </div>
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

      <footer className="site-footer">
        <p>CivixX · privates Hobby-Projekt · Kartendaten © OpenStreetMap-Mitwirkende</p>
        <nav aria-label="Rechtliches">
          <a href="/privacy.html">Datenschutz</a>
          <a href="/cookies.html">Cookies</a>
          <a href="/terms.html">Nutzungsbedingungen</a>
        </nav>
      </footer>
    </div>
  )
}
