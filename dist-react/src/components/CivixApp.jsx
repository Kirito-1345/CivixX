import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, Marker, Polyline, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { useLocalStorage } from "../hooks/useLocalStorage.js"
import { CATEGORIES, INSTITUTIONS } from "../data/institutions.js"

const LEIPZIG = [51.3397, 12.3731]
const BOUNDS = L.latLngBounds([51.12, 12.00], [51.56, 12.75])
const STORAGE_KEY = "civixx.savedPlaces.v2"
const MARKERS_KEY = "civixx.markers"
const MAX_MARKERS = 50
const MARKER_COLOR = "#d9762b"
const SEARCH_COLOR = "#0b7a71"

const TABS = [
  { key: "orte", label: "Orte" },
  { key: "favoriten", label: "Favoriten" },
  { key: "markierungen", label: "Markierungen" }
]

const ICON_PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  locate: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="7" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></>,
  star: <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8L12 3Z" />,
  route: <><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" /></>
}

function Icon({ name, filled = false }) {
  return (
    <svg className={filled ? "icon is-filled" : "icon"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  )
}

const distance = (a, b) => {
  const x = Math.cos((a.lat + b.lat) * Math.PI / 360) * (a.lng - b.lng)
  const y = a.lat - b.lat
  return 111.32 * Math.hypot(x, y)
}

const formatKm = km => `${km.toLocaleString("de-DE", { maximumFractionDigits: 1 })} km`
const formatCoords = ({ lat, lng }) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`
const formatDuration = seconds => {
  const minutes = Math.max(1, Math.round(seconds / 60))
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}
const keyOf = ({ kind, id }) => id ? `${kind}:${id}` : kind

const iconCache = new Map()
const pinIcon = (color, text, active) => {
  const key = `${color}|${text}|${active}`
  if (!iconCache.has(key)) {
    iconCache.set(key, L.divIcon({
      className: "civix-pin",
      html: `<span class="pin${active ? " is-active" : ""}" style="--pin:${color}"><i>${text}</i></span>`,
      iconSize: [28, 36],
      iconAnchor: [14, 32]
    }))
  }
  return iconCache.get(key)
}

const USER_ICON = L.divIcon({
  className: "civix-pin",
  html: '<span class="user-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    const animate = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (target.bounds) map.fitBounds(target.bounds, { padding: [60, 60], animate })
    else map.flyTo([target.lat, target.lng], target.zoom || 15, { duration: 1.1, animate })
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
  const [toast, setToast] = useState(null)
  const [activeCategory, setActiveCategory] = useState("alle")
  const [tab, setTab] = useState("orte")
  const [selected, setSelected] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [savedPlaces, setSavedPlaces] = useLocalStorage(STORAGE_KEY, [])
  const [storedMarkers, setMarkers] = useLocalStorage(MARKERS_KEY, [])
  const cacheRef = useRef(new Map())
  const abortRef = useRef(null)
  const toastId = useRef(0)
  const stageRef = useRef(null)

  const markers = useMemo(
    () => Array.isArray(storedMarkers) ? storedMarkers.filter(item => item?.id && Number.isFinite(item.lat) && Number.isFinite(item.lng)) : [],
    [storedMarkers]
  )

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
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.action ? 7000 : 4500)
    return () => clearTimeout(timer)
  }, [toast])

  const notify = (text, action) => {
    toastId.current += 1
    setToast({ id: toastId.current, text, action })
  }

  const dropRouteFor = key => setRoute(current => current?.refs.includes(key) ? null : current)

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
      if (!result) { notify("Keine passende Adresse gefunden."); return }
      const position = { lat: Number.parseFloat(result.lat), lng: Number.parseFloat(result.lon) }
      if (!BOUNDS.contains(position)) { notify("Die Adresse liegt außerhalb von Leipzig."); return }
      dropRouteFor("search")
      setSearchResult({ ...position, name: value, address: result.display_name })
      setSelected({ kind: "search" })
      setFlyTarget({ ...position, zoom: 16 })
    } catch (error) {
      if (error.name !== "AbortError") notify("Suche fehlgeschlagen.")
    } finally { setBusy(false) }
  }

  const locate = () => {
    if (!navigator.geolocation) { notify("Standort wird von diesem Browser nicht unterstützt."); return }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const position = { lat: coords.latitude, lng: coords.longitude }
      if (!BOUNDS.contains(position)) { notify("Dein Standort liegt außerhalb von Leipzig."); return }
      dropRouteFor("location")
      setUserPosition(position)
      setFlyTarget({ ...position, zoom: 16 })
      notify("Standort gefunden.")
    }, () => notify("Standort konnte nicht ermittelt werden."), { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 })
  }

  const isSaved = useCallback(id => savedPlaces.some(item => item.id === id), [savedPlaces])

  const toggleSaved = item => {
    if (isSaved(item.id)) {
      setSavedPlaces(current => current.filter(({ id }) => id !== item.id))
      notify("Aus Favoriten entfernt.")
    } else {
      setSavedPlaces(current => [{ ...item }, ...current].slice(0, 50))
      notify("Zu Favoriten hinzugefügt.")
    }
  }

  const handleMapClick = latlng => {
    if (selected) { setSelected(null); return }
    if (!BOUNDS.contains(latlng)) { notify("Dieser Punkt liegt außerhalb von Leipzig."); return }
    if (markers.length >= MAX_MARKERS) { notify(`Maximal ${MAX_MARKERS} Markierungen. Entferne zuerst eine.`); return }
    const marker = {
      id: `m-${Date.now().toString(36)}-${toastId.current}`,
      n: markers.reduce((max, item) => Math.max(max, item.n || 0), 0) + 1,
      lat: latlng.lat,
      lng: latlng.lng
    }
    setMarkers(current => [marker, ...(Array.isArray(current) ? current : [])])
    notify(`Markierung ${marker.n} gesetzt.`, { label: "Rückgängig", run: () => removeMarker(marker.id, true) })
  }

  const removeMarker = (id, silent = false) => {
    const index = markers.findIndex(item => item.id === id)
    const removed = markers[index]
    setMarkers(current => Array.isArray(current) ? current.filter(item => item.id !== id) : [])
    setSelected(current => current?.kind === "marker" && current.id === id ? null : current)
    dropRouteFor(`marker:${id}`)
    if (silent || !removed) return
    notify(`Markierung ${removed.n} entfernt.`, {
      label: "Rückgängig",
      run: () => setMarkers(current => current.some(item => item.id === id) ? current : [...current.slice(0, index), removed, ...current.slice(index)])
    })
  }

  const clearMarkers = () => {
    const snapshot = markers
    if (!snapshot.length) return
    setMarkers([])
    setSelected(current => current?.kind === "marker" ? null : current)
    setRoute(current => current?.refs.some(ref => ref.startsWith("marker:")) ? null : current)
    notify(`${snapshot.length} ${snapshot.length === 1 ? "Markierung" : "Markierungen"} entfernt.`, {
      label: "Rückgängig",
      run: () => setMarkers(current => [...current, ...snapshot.filter(item => !current.some(({ id }) => id === item.id))])
    })
  }

  const removeSearch = () => {
    setSearchResult(null)
    setSelected(current => current?.kind === "search" ? null : current)
    dropRouteFor("search")
  }

  const removeLocation = () => {
    setUserPosition(null)
    setSelected(current => current?.kind === "location" ? null : current)
    dropRouteFor("location")
  }

  const removeDetail = item => {
    if (item.kind === "marker") removeMarker(item.id)
    else if (item.kind === "search") removeSearch()
    else if (item.kind === "location") removeLocation()
  }

  const select = (ref, position) => {
    setSelected(ref)
    setFlyTarget({ lat: position.lat, lng: position.lng, zoom: 16 })
    stageRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }

  const detail = useMemo(() => {
    if (!selected) return null
    if (selected.kind === "institution") {
      const item = INSTITUTIONS.find(({ id }) => id === selected.id)
      return item ? { ...selected, name: item.name, address: item.address, lat: item.lat, lng: item.lng, tag: CATEGORIES[item.category].label, color: CATEGORIES[item.category].color, source: item } : null
    }
    if (selected.kind === "marker") {
      const item = markers.find(({ id }) => id === selected.id)
      return item ? { ...selected, name: `Markierung ${item.n}`, address: formatCoords(item), lat: item.lat, lng: item.lng, tag: "Eigene Markierung", color: MARKER_COLOR } : null
    }
    if (selected.kind === "search" && searchResult) return { ...selected, ...searchResult, tag: "Suchergebnis", color: SEARCH_COLOR }
    if (selected.kind === "location" && userPosition) return { ...selected, ...userPosition, name: "Mein Standort", address: formatCoords(userPosition), tag: "Standort", color: "#2f6fed" }
    return null
  }, [selected, markers, searchResult, userPosition])

  const routeStart = useMemo(() => {
    if (!detail) return null
    const candidates = [
      userPosition && { key: "location", name: "Mein Standort", ...userPosition },
      searchResult && { key: "search", name: searchResult.name, lat: searchResult.lat, lng: searchResult.lng },
      ...markers.map(item => ({ key: `marker:${item.id}`, name: `Markierung ${item.n}`, lat: item.lat, lng: item.lng }))
    ]
    return candidates.find(item => item && item.key !== keyOf(detail)) || null
  }, [detail, userPosition, searchResult, markers])

  const navigateTo = async (start, destination) => {
    setRouteBusy(true)
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      const response = await fetch(url)
      if (!response.ok) throw new Error("network")
      const data = await response.json()
      if (data.code !== "Ok" || !data.routes?.length) { notify("Keine Route gefunden."); return }
      const positions = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon])
      setRoute({
        positions,
        distance: data.routes[0].distance / 1000,
        duration: data.routes[0].duration,
        label: `${start.name} → ${destination.name}`,
        refs: [start.key, keyOf(destination)]
      })
      setFlyTarget({ bounds: L.latLngBounds(positions) })
    } catch { notify("Routenberechnung fehlgeschlagen.") } finally { setRouteBusy(false) }
  }

  const institutions = useMemo(() => {
    const value = query.trim().toLowerCase()
    const origin = userPosition || searchResult
    return INSTITUTIONS
      .filter(item => activeCategory === "alle" || item.category === activeCategory)
      .filter(item => !value || `${item.name} ${item.address} ${item.tags.join(" ")}`.toLowerCase().includes(value))
      .map(item => origin ? { ...item, distance: distance(origin, item) } : item)
      .sort((a, b) => origin ? a.distance - b.distance : a.name.localeCompare(b.name, "de"))
  }, [activeCategory, query, userPosition, searchResult])

  const favorites = useMemo(
    () => savedPlaces.map(({ id }) => INSTITUTIONS.find(item => item.id === id)).filter(Boolean),
    [savedPlaces]
  )

  const counts = { orte: institutions.length, favoriten: favorites.length, markierungen: markers.length }
  const isActive = (kind, id) => selected?.kind === kind && selected.id === id

  const institutionRow = item => (
    <li key={item.id} className={isActive("institution", item.id) ? "row is-active" : "row"}>
      <button type="button" className="row-main" onClick={() => select({ kind: "institution", id: item.id }, item)}>
        <span className="dot" style={{ "--dot": CATEGORIES[item.category].color }} />
        <span className="row-text">
          <strong>{item.name}</strong>
          <small>{item.address}</small>
        </span>
        {item.distance !== undefined && <em>{formatKm(item.distance)}</em>}
      </button>
      <button type="button" className={isSaved(item.id) ? "icon-btn is-on" : "icon-btn"} onClick={() => toggleSaved(item)} aria-pressed={isSaved(item.id)} aria-label={isSaved(item.id) ? `${item.name} aus Favoriten entfernen` : `${item.name} merken`}>
        <Icon name="star" filled={isSaved(item.id)} />
      </button>
    </li>
  )

  return (
    <main className="app">
      <aside className="panel" aria-label="Suche und Listen">
        <div className="panel-head">
          <p className="eyebrow">Bildung in Leipzig</p>
          <h1>Finde Orte zum Lernen.</h1>
          <form className="search" onSubmit={search}>
            <label className="sr-only" htmlFor="address">Adresse oder Einrichtung suchen</label>
            <div className="search-field">
              <Icon name="search" />
              <input id="address" value={query} onChange={event => setQuery(event.target.value)} placeholder="Adresse oder Einrichtung" autoComplete="off" enterKeyHint="search" />
              {query && (
                <button type="button" className="icon-btn" onClick={() => setQuery("")} aria-label="Eingabe löschen"><Icon name="close" /></button>
              )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy || !query.trim()}>{busy ? "Suche…" : "Suchen"}</button>
            <button type="button" className="btn btn-icon" onClick={locate} aria-label="Meinen Standort anzeigen" title="Meinen Standort anzeigen"><Icon name="locate" /></button>
          </form>
        </div>

        <div className="panel-body">
          <div className="tabs">
            {TABS.map(({ key, label }) => (
              <button key={key} type="button" className={tab === key ? "tab is-active" : "tab"} aria-pressed={tab === key} onClick={() => setTab(key)}>
                {label}<span className="count">{counts[key]}</span>
              </button>
            ))}
          </div>

          {tab === "orte" && (
            <>
              <div className="chips">
                <button type="button" className={activeCategory === "alle" ? "chip is-active" : "chip"} aria-pressed={activeCategory === "alle"} onClick={() => setActiveCategory("alle")}>Alle</button>
                {Object.entries(CATEGORIES).map(([key, { label, color }]) => (
                  <button key={key} type="button" className={activeCategory === key ? "chip is-active" : "chip"} aria-pressed={activeCategory === key} onClick={() => setActiveCategory(key)}>
                    <span className="dot" style={{ "--dot": color }} />{label}
                  </button>
                ))}
              </div>
              <ul className="list">{institutions.map(institutionRow)}</ul>
              {!institutions.length && <p className="empty">Keine Einrichtung passt dazu. Mit „Suchen“ findest du die Adresse auf der Karte.</p>}
            </>
          )}

          {tab === "favoriten" && (
            <>
              <ul className="list">{favorites.map(institutionRow)}</ul>
              {!favorites.length && <p className="empty">Noch keine Favoriten. Merke dir Einrichtungen über den Stern.</p>}
            </>
          )}

          {tab === "markierungen" && (
            <>
              {markers.length > 0 && (
                <div className="list-head">
                  <span>Auf der Karte gesetzt</span>
                  <button type="button" className="link-btn danger" onClick={clearMarkers}>Alle entfernen</button>
                </div>
              )}
              <ul className="list">
                {markers.map(item => (
                  <li key={item.id} className={isActive("marker", item.id) ? "row is-active" : "row"}>
                    <button type="button" className="row-main" onClick={() => select({ kind: "marker", id: item.id }, item)}>
                      <span className="badge">{item.n}</span>
                      <span className="row-text">
                        <strong>Markierung {item.n}</strong>
                        <small>{formatCoords(item)}</small>
                      </span>
                    </button>
                    <button type="button" className="icon-btn danger" onClick={() => removeMarker(item.id)} aria-label={`Markierung ${item.n} entfernen`} title="Entfernen">
                      <Icon name="trash" />
                    </button>
                  </li>
                ))}
              </ul>
              {!markers.length && <p className="empty">Noch keine Markierungen. Klicke auf die Karte, um eine zu setzen.</p>}
            </>
          )}
        </div>
      </aside>

      <section className="stage" ref={stageRef} aria-label="Karte">
        <MapContainer center={LEIPZIG} zoom={12} minZoom={10} maxZoom={19} maxBounds={BOUNDS} maxBoundsViscosity={0.8} className="map" scrollWheelZoom zoomControl={false}>
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende' />
          <ZoomControl position="topright" />
          <FlyTo target={flyTarget} />
          <MapEvents onSelect={handleMapClick} />
          {route && <Polyline positions={route.positions} pathOptions={{ color: "#0b7a71", weight: 5, opacity: 0.9 }} />}
          {INSTITUTIONS.map(item => (
            <Marker key={item.id} position={[item.lat, item.lng]} title={item.name} alt={item.name}
              icon={pinIcon(CATEGORIES[item.category].color, "", isActive("institution", item.id))}
              zIndexOffset={isActive("institution", item.id) ? 1000 : 0}
              eventHandlers={{ click: () => select({ kind: "institution", id: item.id }, item) }} />
          ))}
          {markers.map(item => (
            <Marker key={item.id} position={[item.lat, item.lng]} title={`Markierung ${item.n}`} alt={`Markierung ${item.n}`}
              icon={pinIcon(MARKER_COLOR, item.n, isActive("marker", item.id))}
              zIndexOffset={isActive("marker", item.id) ? 1000 : 200}
              eventHandlers={{ click: () => select({ kind: "marker", id: item.id }, item) }} />
          ))}
          {searchResult && (
            <Marker position={[searchResult.lat, searchResult.lng]} title={searchResult.name} alt={searchResult.name}
              icon={pinIcon(SEARCH_COLOR, "", selected?.kind === "search")} zIndexOffset={500}
              eventHandlers={{ click: () => select({ kind: "search" }, searchResult) }} />
          )}
          {userPosition && (
            <Marker position={[userPosition.lat, userPosition.lng]} title="Mein Standort" alt="Mein Standort" icon={USER_ICON} zIndexOffset={600}
              eventHandlers={{ click: () => select({ kind: "location" }, userPosition) }} />
          )}
        </MapContainer>

        <div className="stage-top">
          {route && (
            <div className="route-bar">
              <Icon name="route" />
              <span className="row-text">
                <strong>{formatKm(route.distance)} · {formatDuration(route.duration)}</strong>
                <small>{route.label}</small>
              </span>
              <button type="button" className="icon-btn" onClick={() => setRoute(null)} aria-label="Route entfernen" title="Route entfernen"><Icon name="close" /></button>
            </div>
          )}
          <div role="status" aria-live="polite">
            {toast && (
              <div className="toast" key={toast.id}>
                <span>{toast.text}</span>
                {toast.action && <button type="button" className="link-btn" onClick={() => { toast.action.run(); setToast(null) }}>{toast.action.label}</button>}
              </div>
            )}
          </div>
        </div>

        {detail && (
          <section className="detail" aria-label="Ausgewählter Ort">
            <header>
              <span className="tag"><span className="dot" style={{ "--dot": detail.color }} />{detail.tag}</span>
              <button type="button" className="icon-btn" onClick={() => setSelected(null)} aria-label="Schließen"><Icon name="close" /></button>
            </header>
            <h2>{detail.name}</h2>
            <p>{detail.address}</p>
            <div className="detail-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigateTo(routeStart, detail)} disabled={routeBusy || !routeStart}>
                <Icon name="route" />{routeBusy ? "Route…" : "Route hierher"}
              </button>
              {detail.kind === "institution" ? (
                <button type="button" className="btn" onClick={() => toggleSaved(detail.source)}>
                  <Icon name="star" filled={isSaved(detail.id)} />{isSaved(detail.id) ? "Gemerkt" : "Merken"}
                </button>
              ) : (
                <button type="button" className="btn btn-danger" onClick={() => removeDetail(detail)}>
                  <Icon name="trash" />Entfernen
                </button>
              )}
            </div>
            <p className="hint">{routeStart ? `Start: ${routeStart.name}` : "Für eine Route den Standort freigeben oder einen Startpunkt auf der Karte markieren."}</p>
          </section>
        )}
      </section>
    </main>
  )
}
