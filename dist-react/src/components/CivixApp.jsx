import { lazy, Suspense, useEffect, useEffectEvent, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useStoredState } from "../hooks/useStoredState.js"
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion.js"
import { useDocumentTitle } from "../hooks/useDocumentTitle.js"
import { CATEGORIES, INSTITUTIONS } from "../data/institutions.js"
import { FAVORITES } from "../data/favorites.js"
import { inArea, LEIPZIG } from "../lib/area.js"
import { indexPlaces, selectPlaces } from "../lib/places.js"
import { parseUrlState, serializeUrlState } from "../lib/urlState.js"
import { fetchRoute, geocode } from "../lib/services.js"
import { geoMessages, routeMessages, searchMessages } from "../lib/messages.js"
import { formatCount, formatDistance, formatDuration } from "../utils/format.js"
import CategoryFilter from "./CategoryFilter.jsx"
import CategoryShape from "./CategoryShape.jsx"
import MapErrorBoundary from "./MapErrorBoundary.jsx"
import PlaceList from "./PlaceList.jsx"
import SectionLabel from "./SectionLabel.jsx"

// Leaflet (~150 kB) erst laden, wenn die Karte gebraucht wird.
const MapView = lazy(() => import("./MapView.jsx"))

const PLACE_INDEX = indexPlaces(INSTITUTIONS)
const BY_ID = new Map(INSTITUTIONS.map(item => [item.id, item]))
const URL_CONTEXT = { categories: Object.keys(CATEGORIES), placeIds: new Set(BY_ID.keys()) }
const DEFAULT_TITLE = "CivixX – Bildungseinrichtungen in Leipzig"

const STORAGE_NOTES = {
  corrupt: "Gespeicherte Favoriten waren unlesbar. Eine Sicherung liegt im Browser unter „civixx.favorites.backup“; neue Favoriten werden normal gespeichert.",
  newer: "Deine Favoriten stammen aus einer neueren Version von CivixX. Seite neu laden, um sie zu sehen und zu ändern.",
  unavailable: "Dein Browser blockiert den lokalen Speicher. Favoriten gelten nur bis zum Schließen der Seite."
}

function useNotice() {
  const [notice, setNotice] = useState(null)
  const [held, setHeld] = useState(false) // Fokus im Statusbereich: nicht wegblenden, solange jemand den Button bedient

  useEffect(() => {
    if (!notice || held) return
    const timer = setTimeout(() => setNotice(null), notice.action ? 10000 : 5000)
    return () => clearTimeout(timer)
  }, [notice, held])

  const notify = (text, tone = "info", action = null) => {
    setHeld(false)
    setNotice({ text, tone, action })
  }
  return { notice, notify, clear: () => setNotice(null), hold: setHeld }
}

export default function CivixApp() {
  const [searchParams, setSearchParams] = useSearchParams()
  const url = parseUrlState(searchParams, URL_CONTEXT)
  const selected = url.placeId ? BY_ID.get(url.placeId) : null
  const reducedMotion = usePrefersReducedMotion()
  const { notice, notify, clear, hold } = useNotice()
  const [geo, setGeo] = useState({ status: "idle", position: null })
  const [recenter, setRecenter] = useState(0)
  const [savedIds, setSavedIds, storageStatus] = useStoredState(FAVORITES)
  const inputRef = useRef(null)
  const statusRef = useRef(null)
  const lastView = useRef(null)

  // Async-Antworten bauen auf der aktuellen URL auf, nicht auf der beim Start des Requests.
  const latestParams = useRef(searchParams)
  useEffect(() => { latestParams.current = searchParams }, [searchParams])

  const commit = (changes, { replace = false } = {}) => {
    const current = latestParams.current
    const next = serializeUrlState({ ...parseUrlState(current, URL_CONTEXT), ...changes })
    if (next.toString() === current.toString()) return
    latestParams.current = next
    setSearchParams(next, { replace, preventScrollReset: true })
  }

  // Startpunkt: gesetzter Kartenpunkt (teilbar, in der URL) oder eigener Standort (nur lokal).
  const start = url.start ? { ...url.start, label: "Kartenpunkt" } : geo.position ? { ...geo.position, label: "Mein Standort" } : null
  const routeActive = url.route && Boolean(start)

  // Ungültige oder überholte Parameter (unbekannte Kategorie/ID, Route ohne Start) still bereinigen.
  useEffect(() => {
    const normalized = serializeUrlState({ ...url, route: routeActive })
    if (normalized.toString() !== searchParams.toString()) {
      latestParams.current = normalized
      setSearchParams(normalized, { replace: true, preventScrollReset: true })
    }
  })

  useDocumentTitle(selected ? `${selected.name} – CivixX` : DEFAULT_TITLE)

  // ── Suche: getippter Text filtert die Liste, abgeschickter Text wird geocodiert ──
  const submittedQuery = url.search?.query ?? ""
  const [draft, setDraft] = useState(submittedQuery)
  const [syncedQuery, setSyncedQuery] = useState(submittedQuery)
  if (syncedQuery !== submittedQuery) { // Back/Forward oder Zurücksetzen übernimmt den Suchtext
    setSyncedQuery(submittedQuery)
    setDraft(submittedQuery)
  }
  const listText = draft.trim() === submittedQuery ? "" : draft
  const [searching, setSearching] = useState(false)
  const searchController = useRef(null)

  const runSearch = async (query, { replace }) => {
    searchController.current?.abort()
    const controller = new AbortController()
    searchController.current = controller
    setSearching(true)
    try {
      const position = await geocode(query, { signal: controller.signal })
      if (!position) {
        notify(searchMessages.notFound(query), "error")
        if (replace) commit({ search: null }, { replace: true })
        return
      }
      commit({ search: { query, position }, placeId: null, route: false, view: null }, { replace })
      notify(searchMessages.found, "success")
    } catch (error) {
      if (error?.name === "AbortError") return
      notify(searchMessages.error(error), "error", { label: "Erneut suchen", run: () => runSearch(query, { replace }) })
    } finally {
      if (searchController.current === controller) {
        searchController.current = null
        setSearching(false)
      }
    }
  }

  // Deep-Link mit ?suche= aber ohne aufgelösten Punkt: einmal nachschlagen (Cache zuerst).
  const resolveLinkedSearch = useEffectEvent(query => runSearch(query, { replace: true }))
  const pendingQuery = url.search && !url.search.position ? url.search.query : null
  useEffect(() => {
    if (!pendingQuery) return
    resolveLinkedSearch(pendingQuery)
    return () => searchController.current?.abort()
  }, [pendingQuery])

  const submitSearch = event => {
    event.preventDefault()
    const query = draft.trim()
    if (!query) {
      notify(searchMessages.empty, "error")
      inputRef.current?.focus()
      return
    }
    if (query === url.search?.query && url.search.position) { // schon aufgelöst: kein neuer Request
      commit({ placeId: null, route: false, view: null })
      setRecenter(count => count + 1)
      return
    }
    runSearch(query, { replace: false })
  }

  const clearSearch = () => {
    commit({ search: null })
    inputRef.current?.focus()
  }

  // ── Standort ──
  const locate = () => {
    if (!navigator.geolocation) { notify(geoMessages.unsupported, "error"); return }
    setGeo(current => ({ ...current, status: "loading" }))
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const position = { lat: coords.latitude, lng: coords.longitude }
      if (!inArea(position)) {
        setGeo({ status: "error", position: null })
        notify(geoMessages.outside, "error")
        return
      }
      setGeo({ status: "success", position })
      setRecenter(count => count + 1)
      commit({ start: null, route: false, view: null })
      notify(geoMessages.found, "success")
    }, error => {
      setGeo(current => ({ ...current, status: "error" }))
      notify(geoMessages.error(error), "error", { label: "Erneut versuchen", run: locate })
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 })
  }

  const setStartPoint = point => {
    setGeo({ status: "idle", position: null })
    commit({ start: point, route: false })
    notify("Startpunkt gesetzt. „Route hierher“ berechnet den Weg zur Auswahl.", "success")
  }

  const startAtMapCenter = () => {
    const center = lastView.current ?? url.view ?? LEIPZIG
    setStartPoint({ lat: center.lat, lng: center.lng })
  }

  const removeStart = () => {
    commit({ start: null, route: false })
    notify("Startpunkt entfernt.")
  }

  // ── Route: aus URL abgeleitet, damit Reload und Back/Forward sie wiederherstellen ──
  const [routeAttempt, setRouteAttempt] = useState(0)
  const routeKey = routeActive && selected ? `${start.lat},${start.lng}>${selected.id}#${routeAttempt}` : null
  const [routeState, setRouteState] = useState({ key: null, status: "idle" })
  // Solange zur aktuellen Route kein Ergebnis vorliegt, lädt sie.
  const route = !routeKey ? { status: "idle" } : routeState.key === routeKey ? routeState : { status: "loading" }

  const loadRoute = useEffectEvent((key, signal) => {
    fetchRoute(start, selected, { signal }).then(result => {
      setRouteState({ key, status: "success", ...result })
      notify(`Route erstellt: ${formatDistance(result.distance)} · ca. ${formatDuration(result.duration)}`, "success")
    }, error => {
      if (error?.name === "AbortError") return
      setRouteState({ key, status: "error" })
      notify(routeMessages.error(error), "error", { label: "Erneut versuchen", run: () => setRouteAttempt(count => count + 1) })
    })
  })

  useEffect(() => {
    if (!routeKey) return
    const controller = new AbortController()
    loadRoute(routeKey, controller.signal)
    return () => controller.abort()
  }, [routeKey])

  const requestRoute = () => {
    if (!start) { notify(routeMessages.noStart, "error"); return }
    if (url.route && route.status === "error") setRouteAttempt(count => count + 1)
    commit({ route: true })
  }

  // ── Favoriten ──
  const savedPlaces = savedIds.map(id => BY_ID.get(id)).filter(Boolean)
  const selectedSaved = Boolean(selected) && savedIds.includes(selected.id)

  const toggleSaved = item => {
    const index = savedIds.indexOf(item.id)
    if (index === -1) {
      setSavedIds(ids => [item.id, ...ids.filter(id => id !== item.id)])
      notify(`„${item.name}“ gemerkt.`, "success")
      return
    }
    setSavedIds(ids => ids.filter(id => id !== item.id))
    notify(`„${item.name}“ aus Favoriten entfernt.`, "info", {
      label: "Rückgängig",
      run: () => {
        setSavedIds(ids => ids.includes(item.id) ? ids : [...ids.slice(0, index), item.id, ...ids.slice(index)])
        notify(`„${item.name}“ wiederhergestellt.`, "success")
      }
    })
  }

  // ── Liste und Karte teilen sich dieselbe Auswahl ──
  const origin = start ?? url.search?.position ?? null
  const places = selectPlaces(PLACE_INDEX, { category: url.category, text: listText, origin })
  const placeHref = item => `?${serializeUrlState({ ...url, placeId: item.id, route: false, view: null })}`
  const selectPlace = item => commit({ placeId: item.id, route: false, view: null })

  const baseTarget = selected ? { lat: selected.lat, lng: selected.lng, zoom: 16, key: `ort:${selected.id}` }
    : url.search?.position ? { ...url.search.position, zoom: 15, key: `suche:${url.search.query}` }
    : geo.position ? { ...geo.position, zoom: 15, key: "standort" }
    : null
  const target = baseTarget && { ...baseTarget, key: `${baseTarget.key}#${recenter}` }

  const onViewChange = view => {
    lastView.current = view
    commit({ view }, { replace: true })
  }

  const runNoticeAction = () => {
    const { run } = notice.action
    clear()
    statusRef.current?.focus()
    run()
  }

  const busyLabel = text => <><span className="spinner" aria-hidden="true" />{text}</>

  return (
    <div className="app-main">
      <section className="masthead" aria-labelledby="masthead-title">
        <div className="masthead-main">
          <p className="eyebrow">Bildung vor Ort</p>
          <h1 id="masthead-title">Bildung in Leipzig entdecken<span aria-hidden="true">.</span></h1>
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
        <div className="sidebar">
          <section className="panel" aria-labelledby="panel-suche">
            <div className="panel-head"><SectionLabel id="panel-suche" no="01">Suche</SectionLabel></div>
            <form className="search-panel" role="search" onSubmit={submitSearch} noValidate>
              <label className="sr-only" htmlFor="suche">Adresse oder Einrichtung</label>
              <input ref={inputRef} id="suche" name="suche" type="search" value={draft} onChange={event => setDraft(event.target.value)}
                autoComplete="street-address" enterKeyHint="search" spellCheck={false}
                placeholder="z. B. Augustusplatz 10 oder HTWK…" aria-describedby="suche-hinweis" />
              <button className="btn" type="submit" disabled={searching}>{searching ? busyLabel("Suche…") : "Suchen"}</button>
              <button className="btn btn-secondary" type="button" onClick={locate} disabled={geo.status === "loading"}>{geo.status === "loading" ? busyLabel("Standort…") : "Standort"}</button>
            </form>
            {url.search ? (
              <p id="suche-hinweis" className="search-note">
                <span>Aktive Suche: <strong>{url.search.query}</strong></span>
                <button className="text-button" type="button" onClick={clearSearch}>Zurücksetzen</button>
              </p>
            ) : (
              <p id="suche-hinweis" className="search-note">Tippen filtert die Liste. „Suchen“ zeigt die Adresse auf der Karte.</p>
            )}
          </section>

          <section className="panel" aria-labelledby="panel-einrichtungen">
            <div className="panel-head">
              <SectionLabel id="panel-einrichtungen" no="02">Einrichtungen</SectionLabel>
              <span className="panel-count" aria-label={`${places.length} Treffer`}>{formatCount(places.length)}</span>
            </div>
            <CategoryFilter value={url.category} onChange={category => commit({ category }, { replace: true })} />
            <PlaceList items={places} selectedId={selected?.id} hrefFor={placeHref} className="result-list" label="Einrichtungen"
              empty={listText ? `Keine Einrichtung passt zu „${listText.trim()}“. Mit „Suchen“ die Adresse auf der Karte finden.` : "Keine Treffer. Andere Kategorie wählen."} />
          </section>

          <section className="panel" aria-labelledby="panel-favoriten">
            <div className="panel-head">
              <SectionLabel id="panel-favoriten" no="03">Favoriten</SectionLabel>
              <span className="panel-count" aria-label={`${savedPlaces.length} Favoriten`}>{formatCount(savedPlaces.length)}</span>
            </div>
            {STORAGE_NOTES[storageStatus] && <p className="panel-note">{STORAGE_NOTES[storageStatus]}</p>}
            <PlaceList items={savedPlaces} selectedId={selected?.id} hrefFor={placeHref} className="saved-list" label="Favoriten" compact
              empty="Noch keine Favoriten. Einrichtung wählen und „Merken“ drücken." />
          </section>
        </div>

        <section className="map-stack" aria-labelledby="panel-karte">
          <div className="map-head swiss-dots">
            <SectionLabel id="panel-karte" no="04">Karte</SectionLabel>
            <ul className="map-key" aria-label="Legende">
              <li><span className="key-selected" aria-hidden="true" />Auswahl</li>
              <li><span className="key-user" aria-hidden="true" />Startpunkt</li>
              <li><span className="key-route" aria-hidden="true" />Route</li>
            </ul>
          </div>
          <div className="map-shell">
            <MapErrorBoundary>
              <Suspense fallback={<div className="map map-fallback swiss-diagonal"><p>Karte wird geladen…</p></div>}>
                <MapView places={places} selected={selected} search={url.search} start={start}
                  route={route.status === "success" ? route : null} view={url.view} target={target} reducedMotion={reducedMotion}
                  onSelect={selectPlace} onMapClick={setStartPoint} onViewChange={onViewChange}
                  onTileError={() => notify("Kartenkacheln laden nicht. Verbindung prüfen; Liste und Suche funktionieren weiter.", "error")} />
              </Suspense>
            </MapErrorBoundary>
          </div>
          <div className="map-tools">
            <p className="map-tools-hint">Klick in die Karte setzt einen Startpunkt.</p>
            <button className="btn btn-secondary btn-small" type="button" onClick={startAtMapCenter}>Kartenmitte als Start</button>
            {url.start && <button className="btn btn-secondary btn-small" type="button" onClick={removeStart}>Startpunkt entfernen</button>}
            {routeActive && <button className="btn btn-secondary btn-small" type="button" onClick={() => commit({ route: false })}>Route entfernen</button>}
          </div>

          {selected ? (
            <section className="detail-card" aria-labelledby="detail-title">
              <span className="detail-mark"><CategoryShape category={selected.category} /></span>
              <div className="detail-body">
                <p className="eyebrow">{CATEGORIES[selected.category]?.label}</p>
                <h3 id="detail-title">{selected.name}</h3>
                <p>{selected.address}</p>
                {route.status === "success" && <p className="detail-route">Route ab {start.label}: {formatDistance(route.distance)} · ca. {formatDuration(route.duration)}</p>}
              </div>
              <div className="detail-actions">
                <button className="btn" type="button" onClick={() => toggleSaved(selected)}>
                  {selectedSaved
                    ? <><span aria-hidden="true">★</span> Entfernen <span className="sr-only">aus Favoriten</span></>
                    : <><span aria-hidden="true">☆</span> Merken</>}
                </button>
                <button className="btn btn-secondary" type="button" onClick={requestRoute} disabled={route.status === "loading"}>
                  {route.status === "loading" ? busyLabel("Route…") : "Route hierher"}
                </button>
              </div>
            </section>
          ) : (
            <div className="detail-card detail-card-empty swiss-diagonal">
              <p>Keine Einrichtung ausgewählt. Eintrag in der Liste oder Marker auf der Karte wählen.</p>
            </div>
          )}
          <div ref={statusRef} tabIndex={-1} className={`status${notice ? " active" : ""}${notice?.tone === "error" ? " error" : ""}`}
            onFocus={() => hold(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) hold(false) }}>
            <p role="status">{notice?.text}</p>
            {notice?.action && <button className="text-button" type="button" onClick={runNoticeAction}>{notice.action.label}</button>}
          </div>
        </section>
      </div>
    </div>
  )
}
