# CivixX

CivixX ist eine interaktive Karte für Bildungseinrichtungen in und um Leipzig. Nutzer können Einrichtungen entdecken, Adressen suchen, ihren Standort anzeigen lassen und eine Route zu einer Einrichtung berechnen.

## Funktionen

- Interaktive Karte von Leipzig mit Schulen, Hochschulen, Bibliotheken, Weiterbildung und Kitas
- Filter nach Kategorie und Textsuche in der Liste
- Adresssuche in Leipzig und Umgebung, Liste sortiert nach Entfernung
- Standortanzeige über den Browser oder eigener Startpunkt per Klick auf die Karte
- Auto-Route vom Startpunkt zur ausgewählten Einrichtung
- Favoriten werden lokal im Browser gespeichert
- Kategorie, ausgewählte Einrichtung, Adresssuche, Startpunkt, Route und Kartenausschnitt stehen als Query-Parameter in der URL und lassen sich teilen (der eigene Standort nicht)
- Responsives Design für Desktop und Mobilgeräte, sichtbarer Tastaturfokus, reduzierte Bewegung wird respektiert
- Kein Tracking und keine Cookies

## Technologie

Die App liegt in `dist-react/` und nutzt React, React Router, Vite, React Leaflet und Leaflet. Externe Dienste: OpenStreetMap-Kacheln, Nominatim (Adresssuche) und der öffentliche OSRM-Server (Routen).

- URL-Zustand: Die Query-Parameter sind die Quelle der Wahrheit, Parsing und Serialisierung liegen in `dist-react/src/lib/urlState.js`.
- Gespeicherter Zustand: Favoriten werden über `dist-react/src/hooks/useStoredState.js` versioniert in `localStorage` abgelegt. Ungültige Daten werden gesichert statt überschrieben.
- Caching: Adressergebnisse bleiben bis zu 7 Tage in `localStorage` (max. 50 Einträge), berechnete Routen bis zu 1 Stunde und nur bis zum Schließen des Tabs in `sessionStorage` (max. 20 Einträge). Damit werden wiederholte Anfragen an Nominatim und OSRM vermieden.

```bash
cd dist-react
npm install
npm run dev
```

Tests (Vitest) und Lint (Oxlint):

```bash
cd dist-react
npm test
npm run lint
```

Für den Produktions-Build:

```bash
cd dist-react
npm run build
npm run preview
```

Die App nutzt Pfade wie `/datenschutz`. Der Webserver muss unbekannte Pfade deshalb auf `index.html` umleiten.

## Hinweise

Die Einrichtungen stehen von Hand gepflegt in `dist-react/src/data/institutions.js`.

Die Oberfläche besteht aus Komponenten in `dist-react/src/components/` (u. a. `CategoryFilter`, `PlaceList`, `MapView`, `ExternalLink`, `MapErrorBoundary` und `RouteError`). Fehler der Karte fangen `MapErrorBoundary` bzw. `RouteError` ab, ohne die Seite insgesamt zu beenden.

Kartendaten: © OpenStreetMap-Mitwirkende.
