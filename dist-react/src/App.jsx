import { BrowserRouter, Route, Routes } from "react-router-dom"
import SiteLayout from "./components/SiteLayout.jsx"
import CivixApp from "./components/CivixApp.jsx"
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
          <Route path="*" element={<main className="legal-page"><article><p className="eyebrow">404</p><h1>Seite nicht gefunden</h1><p className="legal-intro">Die aufgerufene Seite existiert nicht.</p></article></main>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
