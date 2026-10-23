import LegalPage from "../components/LegalPage.jsx"

export default function NotFound() {
  return (
    <LegalPage label="Fehler" title="Seite nicht gefunden" intro="Die aufgerufene Seite existiert nicht. Zur Karte zurückkehren.">
      <p className="legal-big" aria-hidden="true">404</p>
    </LegalPage>
  )
}
