# CivixX

CivixX entwickelt eine interaktive Karte, die Bildungseinrichtungen in und um Leipzig anzeigt. Die Karte soll Nutzer dabei unterstützen, lokale Bildungsangebote zu entdecken und passende Einrichtungen in der Region zu finden.

## Features

- Interaktive Karte von Leipzig auf Basis von Leaflet und OpenStreetMap
- Kartenausschnitt ist sinnvoll auf Leipzig und Umgebung begrenzt
- Adresssuche über die öffentliche OpenStreetMap-Nominatim-API
- Anzeige eines Standortes per Browser-Geolocation
- Setzen eigener Marker durch Klick auf die Karte
- Aktuelle Adresssuche wird bei neuer Suche abgebrochen, um veraltete Ergebnisse zu vermeiden
- Klare Fehlermeldungen bei fehlgeschlagener Suche oder Standortermittlung
- Responsives Layout für Desktop und Mobilgeräte
- Modernes, animiertes Farbverlauf-Design
- Animationen werden bei reduzierter Bewegung (`prefers-reduced-motion`) automatisch deaktiviert
- Suchfeld mit verständlichem Label und barrierefreier Fehlermeldung
- Tastaturfreundliche Formulare und sichtbare Fokuszustände
- Karte mit zugänglichem Region-Label
- Ausreichender Farbkontrast für Text und Bedienelemente
- Keine Cookies, kein Local Storage und kein Tracking
- Es werden nur notwendige Daten verarbeitet: Suchbegriff bei Suche, optionaler Standort bei Standortfunktion
- Hinweis zur Datenverarbeitung bei der Adresssuche
- OpenStreetMap-Attribution als korrekte Quellenangabe
- Keine Fake-Rezensionen oder unbelegten Werbeaussagen
- Kennzeichnung als privates, nicht kommerzielles Hobby-Projekt
- Login-Menü mit Hinweis zur geplanten Google-Verbindung und Orte-Synchronisierung
- Gemerkte Orte werden lokal im Browser gespeichert und angezeigt
- Rechtsseiten für Datenschutz, Cookies und Nutzungsbedingungen
- Hinweis, dass keine Zahlungen möglich sind und daher keine Erstattungsbedingungen nötig sind

## Projektstruktur

- `index.html`: interaktive Karte, Suche und Standortfunktion
- `privacy.html`: Datenschutzerklärung
- `cookies.html`: Cookie-Richtlinie
- `terms.html`: Nutzungsbedingungen

## Externe Dienste

- OpenStreetMap-Tiles für Kartendarstellung
- OpenStreetMap Nominatim für Adresssuche
- cdnjs.cloudflare.com für Leaflet

Diese Dienste werden ohne API-Key genutzt. Der öffentliche Nominatim- und OSRM-Demo-Server ist für kleine Hobby-Projekte geeignet, bietet aber keine Verfügbarkeitsgarantie und ist nicht für produktive Anwendungen empfohlen.
