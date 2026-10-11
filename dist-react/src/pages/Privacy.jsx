import LegalPage from "../components/LegalPage.jsx"

const SECTIONS = [
  { heading: "Verantwortliche Stelle", body: "Dies ist eine private Hobby-Seite. Der Betreiber ist Julius Bruckner." },
  { heading: "Datenverarbeitung auf dieser Seite", body: "Diese Website setzt keine Cookies, kein Tracking und keine Analyse-Tools ein." },
  { heading: "Adresssuche", body: "Wenn du eine Adresse suchst, wird dein Suchbegriff an den öffentlichen Dienst Nominatim der OpenStreetMap Foundation gesendet. Die Verarbeitung erfolgt zur Bereitstellung der angeforderten Funktion." },
  { heading: "Standortfunktion", body: "Die Standortabfrage erfolgt nur nach ausdrücklichem Klick auf „Standort“ über die Geolocation-API deines Browsers. Der Standort wird im Browser verwendet und nicht an Dritte gesendet." },
  { heading: "Kartendaten", body: "Die Karte nutzt Kacheln von OpenStreetMap. Beim Laden werden deine IP-Adresse und technische Anfragedaten an die Server von OpenStreetMap übertragen." },
  { heading: "Gemerkte Orte", body: "Gemerkte Orte werden im lokalen Speicher deines Browsers gespeichert. Sie werden nicht an Dritte übertragen. Eine Anmeldung und Synchronisierung sind nicht aktiviert." },
  { heading: "Deine Rechte", body: "Du hast jederzeit das Recht auf Auskunft, Berichtigung oder Löschung deiner gespeicherten Daten. Diese Seite speichert keine Nutzerdaten auf einem Server." }
]

export default function Privacy() {
  return <LegalPage title="Datenschutzerklärung" intro="Diese Seite nutzt nur die technisch notwendigen Dienste für Karte, Suche und lokale Speicherung." sections={SECTIONS} />
}
