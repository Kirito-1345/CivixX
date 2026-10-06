import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { useLocalStorage } from "../hooks/useLocalStorage.js"
import { CATEGORIES, INSTITUTIONS } from "../data/institutions.js"

const LEIPZIG = [51.3397, 12.3731]
const BOUNDS = L.latLngBounds([51.12, 12.00], [51.56, 12.75])
const STORAGE_KEY = "civixx.savedPlaces.v2"

const distance = (a, b) => {
  const x = Math.cos((a.lat + b.lat) * Math.PI / 360) * (a.lng - b.lng)
  const y = a.lat - b.lat
  return 111.32 * Math.hypot(x, y)
}

const categoryIcon = color => L.divIcon({
  className: "civix-pin civix-pin-institution",
  html: `<span style="--pin-color:${color}"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 20]
})

const SEARCH_ICON = L.divIcon({
  className: "civix-pin civix-pin-search",
  html: "<span></span>",
  iconSize: [20, 20],
  iconAnchor: [10, 18]
})

const USER_ICON = L.divIcon({
  className: "civix-pin civix-pin-user",
  html: "<span></span>",
  iconSize: [20, 20],
  iconAnchor: [10, 18]
})

function MapReady({ onReady }) {
  const map = useMap()
  useEffect(() => { onReady?.(map) }, [map, onReady])
  return null
}

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target.position, target.zoom || 15, { duration: 1.2 })
  }, [map, target])
  return null
}

function MapEvents({ onSelect }) {
  useMapEvents({ click: event => onSelect(event.latlng) })
  return null
}

export default function CivixApp() {
  const [query, setQuery] = useState("")
  const [searchResult, setSearchResult] = useState(null)
  const [userPosition, setUserPosition] = useState(null)
  const [route, setRoute] = useState(null)
  const [routeBusy, setRouteBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [activeCategory, setActiveCategory] = useState("alle")
  const [selected, setSelected] = useState(null)
  const [savedPlaces, setSavedPlaces] = useLocalStorage(STORAGE_KEY, [])
  const cacheRef = useRef(new Map())
  const abortRef = useRef(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("civixx.geocodeCache")
      const parsed = raw ? JSON.parse(raw) : {}
      Object.entries(parsed).forEach(([key, value]) => {
        if (value?.expires > Date.now()) cacheRef.current.set(key, value)
      })
    } catch { /* Speicher nicht verfügbar */ }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(""), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  const geocode = useCallback(async address => {
    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("q", `${address}, Leipzig`)
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
    const [result] = await response.json()
    if (result) {
      cacheRef.current.set(cacheKey, { result, expires: Date.now() + 86400000 })
      try { localStorage.setItem("civixx.geocodeCache", JSON.stringify(Object.fromEntries(cacheRef.current))) } catch { /* voll */ }
    }
    return result || null
  }, [])

  const search = async event => {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    setBusy(true)
    try {
      const result = await geocode(value)
      if (!result) { setNotice("Keine passende Adresse gefunden."); return }
      const position = [Number.parseFloat(result.lat), Number.parseFloat(result.lon)]
      setSearchResult({ position, label: result.display_name })
      setSelected(null)
      setRoute(null)
    } catch { setNotice("Suche fehlgeschlagen.") } finally { setBusy(false) }
  }

  const locate = () => {
    if (!navigator.geolocation) { setNotice("Geolocation nicht verfügbar."); return }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const position = [coords.latitude, coords.longitude]
      setUserPosition({ position })
      setSearchResult({ position, label: "Mein Standort", zoom: 16 })
      setNotice("Standort gefunden.")
    }, () => setNotice("Standort konnte nicht ermittelt werden."), { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 })
  }

  const isSaved = useCallback(item => savedPlaces.some(({ id }) => id === item.id), [savedPlaces])

  const toggleSaved = item => {
    if (isSaved(item)) {
      setSavedPlaces(current => current.filter(({ id }) => id !== item.id))
      setNotice("Aus Favoriten entfernt.")
    } else {
      setSavedPlaces(current => [{ ...item }, ...current].slice(0, 50))
      setNotice("Zu Favoriten hinzugefügt.")
    }
  }

  const handleMapClick = latlng => {
    const clickedPosition = [latlng.lat, latlng.lng]
    const current = userPosition
    if (current?.label === "Kartenpunkt" && distance({ lat: current.position[0], lng: current.position[1] }, { lat: clickedPosition[0], lng: clickedPosition[1] }) < 0.02) {
      setUserPosition(null)
      setRoute(null)
      setNotice("Punkt entfernt.")
      return
    }
    setUserPosition({ position: clickedPosition, label: "Kartenpunkt" })
    setNotice("Punkt gesetzt.")
  }

  const removeMapPin = () => {
    if (userPosition?.label !== "Kartenpunkt") return
    setUserPosition(null)
    setRoute(null)
    setNotice("Punkt entfernt.")
  }

  const navigateTo = async (start, destination) => {
    if (!start || !destination) { setNotice("Start und Ziel wählen."); return }
    setRouteBusy(true)
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      const response = await fetch(url)
      if (!response.ok) throw new Error("network")
      const data = await response.json()
      if (data.code !== "Ok" || !data.routes?.length) { setNotice("Keine Route gefunden."); return }
      setRoute({
        positions: data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]),
        start, destination
      })
      setNotice("Route erstellt.")
    } catch { setNotice("Routenberechnung fehlgeschlagen.") } finally { setRouteBusy(false) }
  }

  const institutions = useMemo(() => {
    const value = query.trim().toLowerCase()
    const origin = userPosition?.position || searchResult?.position || null
    return INSTITUTIONS
      .filter(item => activeCategory === "alle" || item.category === activeCategory)
      .filter(item => !value || `${item.name} ${item.address} ${item.tags.join(" ")}`.toLowerCase().includes(value))
      .map(item => origin ? { ...item, distance: distance(origin, item) } : item)
      .sort((a, b) => a.distance && b.distance ? a.distance - b.distance : a.name.localeCompare(b.name, "de"))
  }, [activeCategory, query, userPosition, searchResult])

  const select = item => {
    setSelected(item)
    setSearchResult({ position: [item.lat, item.lng], label: item.name, zoom: 16 })
  }

  return (
    <main className="app-main">
      <section className="hero">
        <p className="eyebrow">Bildung vor Ort</p>
        <h1>Bildung in Leipzig entdecken.</h1>
        <p className="lead">Finde Schulen, Hochschulen, Bibliotheken und Weiterbildungsangebote in deiner Nähe – mit Favoriten, Routenplanung und interaktiver Karte.</p>
      </section>

      <div className="workspace">
        <aside className="sidebar">
          <form className="search-panel" onSubmit={search}>
            <label className="sr-only" htmlFor="address">Adresse suchen</label>
            <input id="address" value={query} onChange={event => setQuery(event.target.value)} placeholder="Adresse oder Einrichtung suchen" />
            <button type="submit" disabled={busy || !query.trim()}>{busy ? "Suche…" : "Suchen"}</button>
            <button className="secondary" type="button" onClick={locate}>Standort</button>
          </form>

          <div className="category-filter">
            {Object.entries(CATEGORIES).map(([key, { label }]) => (
              <button key={key} type="button" className={activeCategory === key ? "active" : ""} onClick={() => setActiveCategory(key)}>{label}</button>
            ))}
            <button type="button" className={activeCategory === "alle" ? "active" : ""} onClick={() => setActiveCategory("alle")}>Alle</button>
          </div>

          <div className="result-list">
            {institutions.map(item => (
              <button key={item.id} type="button" className="result-item" onClick={() => select(item)}>
                <span className={`category-dot category-${item.category}`} />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.address}</small>
                </span>
                {item.distance !== undefined && <em>{item.distance.toFixed(1)} km</em>}
              </button>
            ))}
            {!institutions.length && <p className="empty">Keine Treffer. Andere Kategorie oder Suchbegriff ausprobieren.</p>}
          </div>

          <div className="saved-section">
            <h2>Favoriten</h2>
            <div className="saved-list">
              {savedPlaces.map(item => (
                <button key={item.id} type="button" onClick={() => select(item)} className="saved-item">{item.name}</button>
              ))}
              {!savedPlaces.length && <p>Noch keine Favoriten.</p>}
            </div>
          </div>
        </aside>

        <div className="map-stack">
          <div className="map-shell">
            <MapContainer center={LEIPZIG} zoom={12} minZoom={10} maxZoom={19} maxBounds={BOUNDS} maxBoundsViscosity={0.8} className="map" scrollWheelZoom>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende' />
              <MapReady />
              <FlyTo target={searchResult} />
              <MapEvents onSelect={handleMapClick} />
              {INSTITUTIONS.map(item => (
                <Marker key={item.id} position={[item.lat, item.lng]} icon={categoryIcon(CATEGORIES[item.category].color)} eventHandlers={{ click: () => select(item) }}>
                  <Popup>
                    <strong>{item.name}</strong><br />{item.address}
                  </Popup>
                </Marker>
              ))}
              {selected && <Marker position={[selected.lat, selected.lng]} icon={SEARCH_ICON} />}
              {userPosition && <Marker position={userPosition.position} icon={USER_ICON} eventHandlers={{ click: removeMapPin }}><Popup>{userPosition.label || "Mein Standort"}</Popup></Marker>}
              {searchResult && !selected && <Marker position={searchResult.position} icon={SEARCH_ICON}><Popup>{searchResult.label}</Popup></Marker>}
              {route && <Polyline positions={route.positions} pathOptions={{ color: "#087e78", weight: 5, opacity: 0.9 }} />}
            </MapContainer>
          </div>

          {selected && (
            <section className="detail-card">
              <span className={`category-dot category-${selected.category}`} />
              <div>
                <h2>{selected.name}</h2>
                <p>{selected.address}</p>
              </div>
              <button type="button" onClick={() => toggleSaved(selected)}>{isSaved(selected) ? "★ Entfernen" : "☆ Merken"}</button>
              <button type="button" className="secondary" onClick={() => { setUserPosition(current => current); navigateTo(userPosition?.position ? { lat: userPosition.position[0], lng: userPosition.position[1] } : null, { lat: selected.lat, lng: selected.lng }) }} disabled={routeBusy}>{routeBusy ? "Route…" : "Route hierher"}</button>
            </section>
          )}
          <p className={notice ? "status active" : "status"} role="status" aria-live="polite">{notice}</p>
        </div>
      </div>
    </main>
  )
}
