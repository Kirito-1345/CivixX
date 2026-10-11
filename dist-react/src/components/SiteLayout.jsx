import { useEffect } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"

const NAV = [
  { to: "/", label: "Karte" },
  { to: "/datenschutz", label: "Datenschutz" }
]

const LEGAL = [
  { to: "/datenschutz", label: "Datenschutz" },
  { to: "/cookies", label: "Cookies" },
  { to: "/nutzungsbedingungen", label: "Nutzungsbedingungen" }
]

export default function SiteLayout() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0) // Verhalten (weich/sofort) regelt das Stylesheet inkl. prefers-reduced-motion
  }, [location.pathname])

  return (
    <div className="page">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"/><path d="M9 9h6M12 6v6"/></svg>
          </span>
          <span>
            <strong>CivixX</strong>
            <small>Bildung entdecken</small>
          </span>
        </Link>
        <nav className="header-nav" aria-label="Hauptnavigation">
          {NAV.map(item => (
            <NavLink key={item.to} className="nav-link" to={item.to} data-label={item.label} end><span>{item.label}</span></NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
      <footer className="site-footer">
        <div className="footer-main">
          <p className="footer-mark" aria-hidden="true">CivixX</p>
          <p className="footer-note">Eine Karte von <a href="https://www.civixx.de/">civixx.de</a> · Kartendaten © OpenStreetMap-Mitwirkende</p>
        </div>
        <nav aria-label="Rechtliches">
          {LEGAL.map(item => <Link key={item.to} to={item.to}>{item.label}</Link>)}
        </nav>
      </footer>
    </div>
  )
}
