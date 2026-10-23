# CivixX – Knowledge Map

## Zweck und Produkt

CivixX ist eine interaktive Karte für Bildungseinrichtungen in Leipzig und Umgebung. Nutzende können Einrichtungen filtern, Adressen suchen, ihren Standort anzeigen lassen, eine Auto-Route vom Standort oder einem Kartenpunkt zu einer Einrichtung berechnen und Einrichtungen lokal als Favoriten merken. Eine Backend-Anbindung, Anmeldung oder Synchronisierung ist nicht aktiv.

## Systemübersicht

```mermaid
flowchart LR
  User[Nutzende] --> Web[React Web-App]
  Web --> Leaflet[React Leaflet / Leaflet]
  Leaflet --> Tiles[OpenStreetMap-Kartenkacheln]
  Web -->|Adresssuche| Nominatim[Öffentlicher Nominatim-Dienst]
  Web -->|Auto-Routen| OSRM[Öffentlicher OSRM-Demo-Server]
  Web -->|Favoriten und Adress-Cache| LS[Browser Local Storage]
  Web -->|Routen-Cache| SS[Browser Session Storage]
  Web -->|Standort nach Zustimmung| Geo[Browser Geolocation API]
```

## Einstiegspunkte und wichtige Dateien

| Bereich | Datei | Zuständigkeit |
| --- | --- | --- |
| Projektbeschreibung | `README.md` | Produktüberblick, Funktionen und Entwicklungsbefehle |
| React-Einstieg | `dist-react/index.html`, `dist-react/src/main.jsx` | HTML-Shell, React-Mount, Leaflet-CSS und globale Styles |
| App-Einstieg | `dist-react/src/App.jsx` | Data Router (`RouterProvider`) mit den Routen aus `routes.jsx` |
| Routen und Fehlerseiten | `dist-react/src/routes.jsx`, `dist-react/src/components/RouteError.jsx`, `dist-react/src/pages/NotFound.jsx` | Karte, Rechtstexte, 404 (`*`) und Fehlergrenzen innerhalb und außerhalb des Seitenrahmens |
| Hauptfunktionalität | `dist-react/src/components/CivixApp.jsx` | Suche, Routenberechnung, Geolocation, Auswahl und Favoriten; Zustand über die URL |
| Karte und Liste | `dist-react/src/components/MapView.jsx`, `MapErrorBoundary.jsx`, `PlaceList.jsx`, `CategoryFilter.jsx` | Leaflet-Karte (mit Fehlergrenze), Ergebnisliste und Kategoriefilter |
| URL-Zustand | `dist-react/src/lib/urlState.js` | Kategorie, Ort, Suche, Startpunkt, Route und Kartenausschnitt als Query-Parameter lesen und schreiben |
| Gebiet | `dist-react/src/lib/area.js` | `LEIPZIG` (Startansicht), `AREA` (Rechteck für Suche und Standort), `ZOOM` (Grenzen) und `inArea` |
| Dienste und Caches | `dist-react/src/lib/services.js`, `dist-react/src/lib/cache.js` | Nominatim-Suche, OSRM-Routen, Fehlerarten (`ServiceError`) und die Caches mit Ablaufzeit |
| Entfernung und Sortierung | `dist-react/src/geo.js`, `dist-react/src/geo.test.js` | Entfernungsformel und Sortierung „nächste zuerst“, mit Tests |
| Einrichtungen | `dist-react/src/data/institutions.js` | Von Hand gepflegte Liste mit Adresse und Koordinaten sowie die Kategorien |
| Favoriten-Schema | `dist-react/src/data/favorites.js` | Schema und Validierung der Favoriten inklusive Migration von Version 2 |
| Persistenz | `dist-react/src/lib/storage.js`, `dist-react/src/hooks/useStoredState.js` | Versionierter, validierter Web-Storage-Umschlag; Hook mit Synchronisierung zwischen Tabs. Unlesbare Daten werden gesichert, nicht überschrieben |
| Hooks | `dist-react/src/hooks/useDocumentTitle.js`, `usePrefersReducedMotion.js` | Seitentitel pro Route und Berücksichtigung von reduzierter Bewegung |
| Gemeinsames Seitenlayout | `dist-react/src/components/SiteLayout.jsx` | Header, Navigation, Footer und Rahmen für React-Seiten |
| UI-Bausteine | `dist-react/src/components/LegalPage.jsx`, `SectionLabel.jsx`, `CategoryShape.jsx` | Gemeinsames Layout der Rechtstexte, nummerierte Abschnittslabels und Kategorie-Formen (Liste, Filter, Kartenmarker) |
| Rechtliche React-Seiten | `dist-react/src/pages/Privacy.jsx`, `dist-react/src/pages/Cookies.jsx`, `dist-react/src/pages/Terms.jsx` | Datenschutz, Cookie-Hinweise und Nutzungsbedingungen |
| Darstellung | `dist-react/src/index.css` | Design-Tokens (Swiss Style in den Farben von civixx.de: Tiefgrün `#0B3B2C`/Weiß/Hellgrün, Akzent `#2BB673`, keine Radien/Schatten), Muster-Klassen, Primitive (`.btn`, `.section-label`) sowie Layout- und Karten-Styles |
| Build-Konfiguration | `dist-react/vite.config.js`, `dist-react/package.json` | Vite-Konfiguration, Skripte und Abhängigkeiten |

## Hauptabläufe

### Adresssuche

1. Das Suchformular in `CivixApp.jsx` ruft `geocode` aus `lib/services.js` auf. Dasselbe Textfeld filtert beim Tippen die Einrichtungsliste.
2. Die App ruft den öffentlichen Nominatim-Endpunkt auf und begrenzt die Suche auf Deutschland sowie das Leipziger Rechteck `AREA` (`viewbox`, `bounded`).
3. Ergebnisse, auch „nicht gefunden“, werden im Browser unter `civixx.cache.geocode` (localStorage) mit 7 Tagen Ablaufzeit gespeichert, höchstens 50 Einträge. Beim Laden werden nur gültige, nicht abgelaufene Einträge übernommen.
4. Die Karte fliegt mit `FlyTo` zur Adresse und zeigt einen Marker. Das Textfeld wird geleert, damit die Liste alle Einrichtungen nach Entfernung zur Adresse zeigt.

### Liste, Auswahl und Favoriten

- Die Liste zeigt Entfernungen ab dem Standort bzw. Kartenpunkt, sonst ab der zuletzt gesuchten Adresse. Ohne beides ist sie alphabetisch sortiert.
- Eine Auswahl (Liste oder Marker) zeigt die Detailkarte, bewegt die Karte über `flyTarget` und entfernt eine vorhandene Route. Der Ausgangspunkt der Entfernungen ändert sich dadurch nicht.
- Favoriten werden als Liste von Einrichtungs-IDs unter `civixx.favorites` in einem versionierten Umschlag `{ v, data }` gespeichert (Schema in `data/favorites.js`, bis zu 500 Einträge). Die alte Version 2 unter `civixx.savedPlaces.v2` wird beim Lesen übernommen.
- Favoriten und Adress-Cache verlassen den Browser nicht.

### Routenberechnung

1. Startpunkt ist der Standort oder ein per Klick gesetzter Kartenpunkt, Ziel die ausgewählte Einrichtung. Ein Klick auf den Kartenpunkt entfernt ihn wieder.
2. „Route hierher“ fragt den öffentlichen OSRM-Demo-Server unter `router.project-osrm.org` mit dem Profil `driving` ab. Dabei verlassen die Start- und Zielkoordinaten den Browser.
3. Eine erfolgreiche GeoJSON-Geometrie wird in Leaflet-Koordinaten umgewandelt und als Polyline gezeichnet. Routen werden unter `civixx.cache.route` nur in `sessionStorage` für eine Stunde gecacht (max. 20), weil sie den Standort enthalten.

### Standort

- `navigator.geolocation` fragt den Browser nach Berechtigung und verwendet hohe Genauigkeit, ein Timeout von zehn Sekunden und einen maximal 30 Sekunden alten Messwert.
- Der Standort wird nur übernommen, wenn er innerhalb von `AREA` liegt. Er landet nie in der URL.

### URL-Zustand

- Filter, Ort, Suche, Startpunkt, Route und Kartenausschnitt stehen als Query-Parameter (`kategorie`, `ort`, `suche`, `punkt`, `start`, `route`, `karte`) in `lib/urlState.js`. Ungültige Werte fallen auf Standardwerte zurück.

## Technische Bausteine

- React 19 und React DOM
- React Router DOM 7 für clientseitiges Routing
- Vite 8 mit React-Plugin
- React Leaflet 5 und Leaflet 1.9
- OpenStreetMap-Kacheln für die Karte
- Nominatim für Adress-Geocoding
- OSRM-Demo-Server für Auto-Routen
- Browser Local Storage für Favoriten und Adress-Cache, Session Storage für Routen-Cache
- Browser Geolocation API für die optionale Standortanzeige

## Geografischer Bereich

Die Karte startet bei Leipzig (`51.3397, 12.3731`, `LEIPZIG` in `dist-react/src/lib/area.js`) und wird in `dist-react/src/components/MapView.jsx` durch die Grenzen aus `AREA` begrenzt. Die Adresssuche ist über Nominatim auf diesen Bereich begrenzt, der Standort wird dagegen geprüft. Änderungen an der unterstützten Region sollten Kartenbegrenzung und Ergebnisprüfungen gemeinsam berücksichtigen.

## Datenschutz und externe Abhängigkeiten

- Kartenkacheln werden von `tile.openstreetmap.org` geladen.
- Suchbegriffe gehen an den öffentlichen Nominatim-Dienst; Routing-Anfragen mit Start- und Zielkoordinaten gehen an `router.project-osrm.org`. Beides steht in der Datenschutzerklärung (`Privacy.jsx`) und muss dort bei Änderungen nachgezogen werden.
- Der Standortzugriff erfolgt über die Browser-API und erfordert Nutzerzustimmung.
- Favoriten und Adress-Cache liegen im Local Storage, der Routen-Cache im Session Storage.
- Es gibt keine Anmeldung und keine serverseitige Synchronisierung.
- Rechtstexte liegen nur noch als React-Seiten unter `dist-react/src/pages/`.

## Entwicklung

In `dist-react/`:

```bash
npm install
npm run dev
```

Produktions-Build und lokale Vorschau:

```bash
npm run build
npm run preview
```

Zusätzlich sind `npm run lint` (Oxlint) und `npm test` (Vitest mit jsdom, Setup in `src/test/setup.js`) definiert. Die Tests liegen neben dem Code, z. B. `src/lib/*.test.js` und `src/components/CivixApp.test.jsx`.

## Bekannte Zustände und zu beachtende Punkte

- Die React-App unter `dist-react/` ist die einzige Version; die ältere Standalone-`index.html` im Projektstamm wurde entfernt.
- Nominatim und der OSRM-Demo-Server sind öffentliche Dienste. Verfügbarkeit und Nutzungsbedingungen liegen außerhalb der App; die lokalen Caches betreffen nur Adress-Suchergebnisse und Routen, nicht die Kartenkacheln.
- Die Kartenkomponente ist durch `MapErrorBoundary` abgesichert, damit ein Kartenfehler Header und Liste nicht mitreißt.
- Die App nutzt `createBrowserRouter` (Data Router). Der Webserver muss unbekannte Pfade auf `index.html` umleiten, sonst führen direkte Aufrufe wie `/datenschutz` zu 404.

## Orientierung für Änderungen

- UI und Nutzerabläufe: `dist-react/src/components/CivixApp.jsx`
- Kategorien: `dist-react/src/data/institutions.js` – jede Kategorie hat eine Form (`shape`, SVG-Pfad) statt einer Farbe; der Akzent (Grün) ist für Auswahl und Route reserviert
- Kartenregion oder Startansicht: `LEIPZIG`, `AREA`, `ZOOM` in `dist-react/src/lib/area.js`; Kartenbegrenzung in `MapView.jsx`
- Storage-Verhalten: `dist-react/src/hooks/useStoredState.js` und `dist-react/src/lib/storage.js`; Favoriten-Schema in `data/favorites.js`
- Adress- und Routen-Caches: `dist-react/src/lib/services.js`, `dist-react/src/lib/cache.js`
- URL-Parameter: `dist-react/src/lib/urlState.js`
- Routing und 404: `dist-react/src/routes.jsx` (`App.jsx` mountet nur den Router)
- Gemeinsamer Seitenrahmen: `dist-react/src/components/SiteLayout.jsx`
- Rechtstexte: `dist-react/src/pages/`
- Globale Gestaltung: `dist-react/src/index.css`
- Abhängigkeiten und Befehle: `dist-react/package.json`
