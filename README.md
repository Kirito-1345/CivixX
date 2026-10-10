# CivixX

CivixX ist eine interaktive Karte für Bildungseinrichtungen in und um Leipzig. Nutzer können Orte entdecken, Adressen suchen und ihren Standort auf der Karte anzeigen lassen.

## Funktionen

- Interaktive Karte von Leipzig
- Adresssuche in Leipzig und Umgebung
- Standortanzeige über den Browser
- Eigene Marker durch Klick auf die Karte, einzeln entfernbar
- Favoriten und Marker werden lokal gespeichert
- Auto-Route zu einem ausgewählten Ort
- Responsives Design für Desktop und Mobilgeräte
- Barrierefreie Steuerung, klare Labels und gute Kontraste
- Kein Tracking und keine Cookies

## Seiten

- `/` – Karte, Suche, Favoriten und Marker
- `/#/datenschutz` – Datenschutz
- `/#/cookies` – Cookie-Hinweise
- `/#/nutzungsbedingungen` – Nutzungsbedingungen

## Technologie

Die React-Version liegt in `dist-react/` und nutzt React, Vite, React Leaflet, Leaflet sowie OpenStreetMap/Nominatim und den öffentlichen OSRM-Server für Routen. Suchergebnisse werden vorübergehend zwischengespeichert, um wiederholte Anfragen zu vermeiden.

```bash
cd dist-react
npm install
npm run dev
```

Für den Produktions-Build:

```bash
cd dist-react
npm run build
npm run preview
```

## Hinweise

Es gibt keine Anmeldung und keine Synchronisierung; alle Daten bleiben im Browser.

Kartendaten: © OpenStreetMap-Mitwirkende.
