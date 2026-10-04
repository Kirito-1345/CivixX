# CivixX

CivixX ist eine interaktive Karte für Bildungseinrichtungen in und um Leipzig. Nutzer können Orte entdecken, Adressen suchen und ihren Standort auf der Karte anzeigen lassen.

## Funktionen

- Interaktive Karte von Leipzig
- Adresssuche in Leipzig und Umgebung
- Standortanzeige über den Browser
- Eigene Marker durch Klick auf die Karte
- Gemerkte Orte werden lokal gespeichert
- Konto-Bereich mit vorbereiteter Google-Anmeldung
- Responsives Design für Desktop und Mobilgeräte
- Animierter Hintergrund mit Rücksicht auf reduzierte Bewegung
- Barrierefreie Steuerung, klare Labels und gute Kontraste
- Kein Tracking und keine Cookies

## Seiten

- `index.html` – Karte, Suche und Konto
- `privacy.html` – Datenschutz
- `cookies.html` – Cookie-Hinweise
- `terms.html` – Nutzungsbedingungen

## Technologie

Die Seite nutzt Leaflet für die Kartendarstellung und OpenStreetMap für Kartendaten und Adresssuche. Suchergebnisse werden vorübergehend zwischengespeichert, um wiederholte Anfragen zu vermeiden.

## Entwicklung

Zum Ausprobieren reicht ein einfacher lokaler Webserver:

```bash
python3 -m http.server 8000
```

Danach ist die Seite unter `http://localhost:8000` erreichbar.

## Hinweise

Die Google-Anmeldung und Synchronisierung sind vorbereitet, aber noch nicht aktiviert. Für den Live-Betrieb werden eine Google OAuth-Konfiguration und ein Speicherdienst benötigt.

Kartendaten: © OpenStreetMap-Mitwirkende.
