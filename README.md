# CivixX

CivixX ist eine interaktive Karte für Bildungseinrichtungen in und um Leipzig. Nutzer können Einrichtungen entdecken, Adressen suchen, ihren Standort anzeigen lassen und eine Route zu einer Einrichtung berechnen.

## Funktionen

- Interaktive Karte von Leipzig mit Schulen, Hochschulen, Bibliotheken, Weiterbildung und Kitas
- Filter nach Kategorie und Textsuche in der Liste
- Adresssuche in Leipzig und Umgebung, Liste sortiert nach Entfernung
- Standortanzeige über den Browser oder eigener Startpunkt per Klick auf die Karte
- Auto-Route vom Startpunkt zur ausgewählten Einrichtung
- Favoriten werden lokal im Browser gespeichert
- Responsives Design für Desktop und Mobilgeräte
- Kein Tracking und keine Cookies

## Technologie

Die App liegt in `dist-react/` und nutzt React, Vite, React Leaflet und Leaflet. Externe Dienste: OpenStreetMap-Kacheln, Nominatim (Adresssuche) und der öffentliche OSRM-Server (Routen). Suchergebnisse werden 24 Stunden im Browser zwischengespeichert, um wiederholte Anfragen zu vermeiden.

```bash
cd dist-react
npm install
npm run dev
```

Tests und Lint:

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

Kartendaten: © OpenStreetMap-Mitwirkende.
