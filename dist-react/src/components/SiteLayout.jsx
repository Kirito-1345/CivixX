import { useEffect } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"

const LEGAL = [
  { to: "/datenschutz", label: "Datenschutz" },
  { to: "/cookies", label: "Cookies" },
  { to: "/nutzungsbedingungen", label: "Nutzungsbedingungen" }
]

export default function SiteLayout() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [location.pathname])

  return (
    <div className="page">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"/><path d="M9 9h6M12 6v6"/></svg>
          </span>
          <strong>CivixX</strong>
        </Link>
        <nav className="header-nav" aria-label="Hauptnavigation">
          <NavLink to="/" end>Karte</NavLink>
          <NavLink to="/datenschutz">Datenschutz</NavLink>
        </nav>
      </header>
      <Outlet />
      <footer className="site-footer">
        <p>CivixX · privates Hobby-Projekt · Kartendaten © OpenStreetMap-Mitwirkende</p>
        <nav aria-label="Rechtliches">
          {LEGAL.map(item => <Link key={item.to} to={item.to}>{item.label}</Link>)}
        </nav>
      </footer>
    </div>
  )
}
