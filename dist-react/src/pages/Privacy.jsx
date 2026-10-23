import ExternalLink from "../components/ExternalLink.jsx"
import LegalPage from "../components/LegalPage.jsx"

const SECTIONS = [
  { heading: "Verantwortliche Stelle", body: <>Diese Karte ist ein Angebot von <span translate="no">CivixX</span> (<ExternalLink href="https://www.civixx.de/" translate="no">www.civixx.de</ExternalLink>). Der Betreiber ist Julius Bruckner.</> },
  { heading: "Datenverarbeitung auf dieser Seite", body: "Diese Website setzt keine Cookies, kein Tracking und keine Analyse-Tools ein." },
  { heading: "Adresssuche", body: "Wenn du eine Adresse suchst, wird dein Suchbegriff an den öffentlichen Dienst Nominatim der OpenStreetMap Foundation gesendet. Die Verarbeitung erfolgt zur Bereitstellung der angeforderten Funktion." },
  { heading: "Standortfunktion", body: "Die Standortabfrage erfolgt nur nach ausdrücklichem Klick auf „Standort“ über die Geolocation-API deines Browsers. Der Standort bleibt im Browser, solange du keine Route berechnest, und wird nie in die Adresszeile übernommen." },
  { heading: "Routenplanung", body: "Wenn du auf „Route hierher“ klickst, werden die Koordinaten des Startpunkts (dein Standort oder ein gesetzter Kartenpunkt) und des Ziels an den öffentlichen Routingdienst router.project-osrm.org des OSRM-Projekts gesendet. Dabei wird auch deine IP-Adresse übertragen." },
  { heading: "Kartendaten", body: "Die Karte nutzt Kacheln von OpenStreetMap. Beim Laden werden deine IP-Adresse und technische Anfragedaten an die Server von OpenStreetMap übertragen." },
  { heading: "Gemerkte Orte", body: "Gemerkte Orte und bis zu 50 Suchergebnisse (7 Tage) werden im lokalen Speicher deines Browsers gespeichert, berechnete Routen nur bis zum Schließen des Tabs. Nichts davon wird an Dritte übertragen. Eine Anmeldung und Synchronisierung sind nicht aktiviert." },
  { heading: "Deine Rechte", body: "Du hast jederzeit das Recht auf Auskunft, Berichtigung oder Löschung deiner gespeicherten Daten. Diese Seite speichert keine Nutzerdaten auf einem Server." }
]

export default function Privacy() {
  return <LegalPage title="Datenschutzerklärung" intro="Diese Seite nutzt nur die technisch notwendigen Dienste für Karte, Suche, Routen und lokale Speicherung." sections={SECTIONS} />
}
