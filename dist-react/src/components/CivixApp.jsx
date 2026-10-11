import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { useLocalStorage } from "../hooks/useLocalStorage.js"
import { CATEGORIES, INSTITUTIONS } from "../data/institutions.js"
import { byDistanceThenName, distance } from "../geo.js"
import CategoryShape from "./CategoryShape.jsx"
import SectionLabel from "./SectionLabel.jsx"

const LEIPZIG = [51.3397, 12.3731]
const BOUNDS = L.latLngBounds([51.12, 12.00], [51.56, 12.75])
const STORAGE_KEY = "civixx.savedPlaces.v2"

const ROUTE_COLOR = "#2bb673"

const shapeIcons = selected => Object.fromEntries(Object.entries(CATEGORIES).map(([key, { shape }]) => [key, L.divIcon({
  className: `civix-pin ${selected ? "civix-pin-selected" : "civix-pin-institution"}`,
  html: `<svg viewBox="0 0 16 16"><path d="${shape}"/></svg>`,
  iconSize: selected ? [30, 30] : [20, 20],
  iconAnchor: selected ? [15, 15] : [10, 10]
})]))

const CATEGORY_ICONS = shapeIcons(false)
const SELECTED_ICONS = shapeIcons(true)

const SEARCH_ICON = L.divIcon({
  className: "civix-pin civix-pin-search",
  html: "<span></span>",
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const USER_ICON = L.divIcon({
  className: "civix-pin civix-pin-user",
  html: "<span></span>",
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

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
  const [flyTarget, setFlyTarget] = useState(null)
  const [userPosition, setUserPosition] = useState(null)
  const [route, setRoute] = useState(null)
  const [routeBusy, setRouteBusy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [activeCategory, setActiveCategory] = useState("alle")
  const [selected, setSelected] = useState(null)
  const [stored, setSavedIds] = useLocalStorage(STORAGE_KEY, [])
  // Ältere Versionen speicherten ganze Einträge statt IDs.
  const savedIds = stored.map(entry => entry?.id ?? entry)
  const savedPlaces = savedIds.map(id => INSTITUTIONS.find(item => item.id === id)).filter(Boolean)
  const cacheRef = useRef(new Map())

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

    const response = await fetch(url)
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
      setFlyTarget({ position })
      setSelected(null)
      setRoute(null)
      setQuery("") // sonst filtert der Adresstext die Liste leer
    } catch { setNotice("Suche fehlgeschlagen.") } finally { setBusy(false) }
  }

  const locate = () => {
    if (!navigator.geolocation) { setNotice("Geolocation nicht verfügbar."); return }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const position = [coords.latitude, coords.longitude]
      if (!BOUNDS.contains(position)) { setNotice("Dein Standort liegt außerhalb von Leipzig."); return }
      setUserPosition({ position })
      setFlyTarget({ position, zoom: 16 })
      setNotice("Standort gefunden.")
    }, () => setNotice("Standort konnte nicht ermittelt werden."), { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 })
  }

  const isSaved = item => savedIds.includes(item.id)

  const toggleSaved = item => {
    if (isSaved(item)) {
      setSavedIds(savedIds.filter(id => id !== item.id))
      setNotice("Aus Favoriten entfernt.")
    } else {
      setSavedIds([item.id, ...savedIds])
      setNotice("Zu Favoriten hinzugefügt.")
    }
  }

  const handleMapClick = latlng => {
    setUserPosition({ position: [latlng.lat, latlng.lng], label: "Kartenpunkt" })
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
    const [lat, lng] = userPosition?.position || searchResult?.position || []
    const origin = lat === undefined ? null : { lat, lng }
    return INSTITUTIONS
      .filter(item => activeCategory === "alle" || item.category === activeCategory)
      .filter(item => !value || `${item.name} ${item.address} ${item.tags.join(" ")}`.toLowerCase().includes(value))
      .map(item => origin ? { ...item, distance: distance(origin, item) } : item)
      .sort(byDistanceThenName)
  }, [activeCategory, query, userPosition, searchResult])

  const select = item => {
    setSelected(item)
    setRoute(null)
    setFlyTarget({ position: [item.lat, item.lng], zoom: 16 })
  }

  return (
    <main className="app-main">
      <section className="masthead">
        <div className="masthead-main">
          <p className="eyebrow">Bildung vor Ort</p>
          <h1>Bildung in Leipzig entdecken<span>.</span></h1>
        </div>
        <div className="masthead-aside">
          <div className="composition swiss-grid-pattern" aria-hidden="true">
            <span className="composition-circle" />
            <span className="composition-square" />
            <span className="composition-bar" />
            <span className="composition-frame" />
          </div>
          <p className="lead">Finde Schulen, Hochschulen, Bibliotheken und Weiterbildungsangebote in deiner Nähe – mit Favoriten, Routenplanung und interaktiver Karte.</p>
          <dl className="stats">
            <div><dt>Einrichtungen</dt><dd>{INSTITUTIONS.length}</dd></div>
            <div><dt>Kategorien</dt><dd>{Object.keys(CATEGORIES).length}</dd></div>
            <div><dt>Favoriten</dt><dd>{savedPlaces.length}</dd></div>
          </dl>
        </div>
      </section>

      <div className="workspace">
        <aside className="sidebar">
          <section className="panel">
            <div className="panel-head"><SectionLabel no="01">Suche</SectionLabel></div>
            <form className="search-panel" onSubmit={search}>
              <label className="sr-only" htmlFor="address">Adresse suchen</label>
              <input id="address" value={query} onChange={event => setQuery(event.target.value)} placeholder="Adresse oder Einrichtung suchen" />
              <button className="btn" type="submit" disabled={busy || !query.trim()}>{busy ? "Suche…" : "Suchen"}</button>
              <button className="btn btn-secondary" type="button" onClick={locate}>Standort</button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <SectionLabel no="02">Einrichtungen</SectionLabel>
              <span className="panel-count">{String(institutions.length).padStart(2, "0")}</span>
            </div>
            <div className="category-filter">
              {Object.entries(CATEGORIES).map(([key, { label }]) => (
                <button key={key} type="button" aria-pressed={activeCategory === key} onClick={() => setActiveCategory(key)}><CategoryShape category={key} />{label}</button>
              ))}
              <button type="button" aria-pressed={activeCategory === "alle"} onClick={() => setActiveCategory("alle")}>Alle</button>
            </div>
            <div className="place-list result-list">
              {institutions.map(item => (
                <button key={item.id} type="button" className="place-row" aria-current={selected?.id === item.id ? "true" : undefined} onClick={() => select(item)}>
                  <CategoryShape category={item.category} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.address}</small>
                  </span>
                  {item.distance !== undefined && <em>{item.distance.toFixed(1)} km</em>}
                </button>
              ))}
              {!institutions.length && <p className="empty">Keine Treffer. Andere Kategorie oder Suchbegriff ausprobieren.</p>}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <SectionLabel no="03">Favoriten</SectionLabel>
              <span className="panel-count">{String(savedPlaces.length).padStart(2, "0")}</span>
            </div>
            <div className="place-list saved-list">
              {savedPlaces.map(item => (
                <button key={item.id} type="button" className="place-row" aria-current={selected?.id === item.id ? "true" : undefined} onClick={() => select(item)}>
                  <CategoryShape category={item.category} />
                  <strong>{item.name}</strong>
                </button>
              ))}
              {!savedPlaces.length && <p className="empty">Noch keine Favoriten.</p>}
            </div>
          </section>
        </aside>

        <section className="map-stack">
          <div className="map-head swiss-dots">
            <SectionLabel no="04">Karte</SectionLabel>
            <ul className="map-key" aria-label="Legende">
              <li><span className="key-selected" aria-hidden="true" />Auswahl</li>
              <li><span className="key-user" aria-hidden="true" />Standort</li>
              <li><span className="key-route" aria-hidden="true" />Route</li>
            </ul>
          </div>
          <div className="map-shell">
            <MapContainer center={LEIPZIG} zoom={12} minZoom={10} maxZoom={19} maxBounds={BOUNDS} maxBoundsViscosity={0.8} className="map" scrollWheelZoom>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende' />
              <FlyTo target={flyTarget} />
              <MapEvents onSelect={handleMapClick} />
              {INSTITUTIONS.map(item => (
                <Marker key={item.id} position={[item.lat, item.lng]} icon={CATEGORY_ICONS[item.category]} eventHandlers={{ click: () => select(item) }}>
                  <Popup>
                    <strong>{item.name}</strong><br />{item.address}
                  </Popup>
                </Marker>
              ))}
              {selected && <Marker position={[selected.lat, selected.lng]} icon={SELECTED_ICONS[selected.category] || SEARCH_ICON} zIndexOffset={1000} />}
              {userPosition && <Marker position={userPosition.position} icon={USER_ICON} eventHandlers={{ click: removeMapPin }}><Popup>{userPosition.label || "Mein Standort"}</Popup></Marker>}
              {searchResult && <Marker position={searchResult.position} icon={SEARCH_ICON}><Popup>{searchResult.label}</Popup></Marker>}
              {route && <Polyline positions={route.positions} pathOptions={{ color: ROUTE_COLOR, weight: 5, opacity: 1 }} />}
            </MapContainer>
          </div>

          {selected ? (
            <section className="detail-card" aria-label="Ausgewählte Einrichtung">
              <span className="detail-mark"><CategoryShape category={selected.category} /></span>
              <div className="detail-body">
                <p className="eyebrow">{CATEGORIES[selected.category]?.label}</p>
                <h2>{selected.name}</h2>
                <p>{selected.address}</p>
              </div>
              <div className="detail-actions">
                <button className="btn" type="button" onClick={() => toggleSaved(selected)}>{isSaved(selected) ? "★ Entfernen" : "☆ Merken"}</button>
                <button className="btn btn-secondary" type="button" onClick={() => navigateTo(userPosition?.position ? { lat: userPosition.position[0], lng: userPosition.position[1] } : null, { lat: selected.lat, lng: selected.lng })} disabled={routeBusy}>{routeBusy ? "Route…" : "Route hierher"}</button>
              </div>
            </section>
          ) : (
            <div className="detail-card detail-card-empty swiss-diagonal">
              <p>Keine Einrichtung ausgewählt. Marker oder Listeneintrag wählen.</p>
            </div>
          )}
          <p className={notice ? "status active" : "status"} role="status" aria-live="polite">{notice}</p>
        </section>
      </div>
    </main>
  )
}
