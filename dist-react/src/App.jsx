import { BrowserRouter, Route, Routes } from "react-router-dom"
import SiteLayout from "./components/SiteLayout.jsx"
import CivixApp from "./components/CivixApp.jsx"
import LegalPage from "./components/LegalPage.jsx"
import Privacy from "./pages/Privacy.jsx"
import Cookies from "./pages/Cookies.jsx"
import Terms from "./pages/Terms.jsx"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<CivixApp />} />
          <Route path="/datenschutz" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/nutzungsbedingungen" element={<Terms />} />
          <Route path="*" element={<LegalPage label="Fehler" title="Seite nicht gefunden" intro="Die aufgerufene Seite existiert nicht."><p className="legal-big" aria-hidden="true">404</p></LegalPage>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
