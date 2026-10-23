import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom"
import { useDocumentTitle } from "../hooks/useDocumentTitle.js"
import LegalPage from "./LegalPage.jsx"

// standalone: Fehler im Seitenrahmen selbst – dann ohne Header/Footer, aber mit eigenem <main>.
export default function RouteError({ standalone = false }) {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  useDocumentTitle(notFound ? "Seite nicht gefunden – CivixX" : "Fehler – CivixX")
  if (!notFound) console.error(error)

  const page = (
    <LegalPage label="Fehler" title={notFound ? "Seite nicht gefunden" : "Etwas ist schiefgelaufen"} intro={notFound ? "Die aufgerufene Seite existiert nicht. Zur Karte zurückkehren." : "Diese Ansicht konnte nicht angezeigt werden. Seite neu laden oder zur Karte zurückkehren."}>
      <div className="legal-actions">
        <button className="btn" type="button" onClick={() => window.location.reload()}>Neu laden</button>
        {standalone ? <a className="btn btn-secondary" href="/">Zur Karte</a> : <Link className="btn btn-secondary" to="/">Zur Karte</Link>}
      </div>
    </LegalPage>
  )
  return standalone ? <main id="main" tabIndex={-1}>{page}</main> : page
}
