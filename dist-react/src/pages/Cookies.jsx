import LegalPage from "../components/LegalPage.jsx"

const SECTIONS = [
  { heading: "Lokale Speicherung", body: "Gemerkte Orte und Suchergebnisse werden im lokalen Speicher deines Browsers gespeichert, berechnete Routen nur bis zum Schließen des Tabs. Sie verlassen deinen Browser nicht." },
  { heading: "Kein Consent-Banner", body: "Da keine Cookies gesetzt werden, ist kein Cookie-Consent-Banner erforderlich." }
]

export default function Cookies() {
  return <LegalPage title="Cookie-Richtlinie" intro="Diese Website verwendet keine Cookies und kein Tracking." sections={SECTIONS} />
}
