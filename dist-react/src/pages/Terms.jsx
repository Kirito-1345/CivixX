import LegalPage from "../components/LegalPage.jsx"

const SECTIONS = [
  { heading: "Keine Gewährleistung", body: "Karten- und Standortdaten können unvollständig oder veraltet sein. Für die Richtigkeit wird keine Gewähr übernommen." },
  { heading: "Keine Zahlungen", body: "Es werden keine kommerziellen Leistungen angeboten oder Zahlungen entgegengenommen." },
  { heading: "Quellen", body: "Kartendaten: © OpenStreetMap-Mitwirkende." }
]

export default function Terms() {
  return <LegalPage title="Nutzungsbedingungen" intro="Diese Website ist ein privates, nicht kommerzielles Hobby-Projekt." sections={SECTIONS} />
}
