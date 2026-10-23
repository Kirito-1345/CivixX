import ExternalLink from "../components/ExternalLink.jsx"
import LegalPage from "../components/LegalPage.jsx"

const SECTIONS = [
  { heading: "Keine Gewährleistung", body: "Karten- und Standortdaten können unvollständig oder veraltet sein. Für die Richtigkeit wird keine Gewähr übernommen." },
  { heading: "Keine Zahlungen", body: "Es werden keine kommerziellen Leistungen angeboten oder Zahlungen entgegengenommen." },
  { heading: "Quellen", body: "Kartendaten: © OpenStreetMap-Mitwirkende." }
]

export default function Terms() {
  return <LegalPage title="Nutzungsbedingungen" intro={<>Diese Karte ist ein Angebot von CivixX. Mehr zum Projekt auf <ExternalLink href="https://www.civixx.de/" translate="no">civixx.de</ExternalLink>.</>} sections={SECTIONS} />
}
