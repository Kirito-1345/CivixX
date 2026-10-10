import { useEffect, useState } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"

const LEGAL = [
  { to: "/datenschutz", label: "Datenschutz" },
  { to: "/cookies", label: "Cookies" },
  { to: "/nutzungsbedingungen", label: "Nutzungsbedingungen" }
]

export default function SiteLayout({ children }) {
  const location = useLocation()
  const [cookieNotice, setCookieNotice] = useState(() => {
    try { return localStorage.getItem("civixx.cookieNotice") !== "accepted" } catch { return true }
  })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [location.pathname])

  const acceptCookies = () => {
    try { localStorage.setItem("civixx.cookieNotice", "accepted") } catch { /* Speicher nicht verfügbar */ }
    setCookieNotice(false)
  }

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
      {children || <Outlet />}
      {cookieNotice && (
        <div className="cookie-popup" role="dialog" aria-modal="false" aria-labelledby="cookie-title" aria-describedby="cookie-text">
          <div>
            <h2 id="cookie-title">Keine Cookies, kein Tracking</h2>
            <p id="cookie-text">Favoriten und Markierungen bleiben nur lokal in deinem Browser.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={acceptCookies}>Verstanden</button>
        </div>
      )}
      <footer className="site-footer">
        <p>CivixX · privates Hobby-Projekt · Kartendaten © OpenStreetMap-Mitwirkende</p>
        <nav aria-label="Rechtliches">
          {LEGAL.map(item => <Link key={item.to} to={item.to}>{item.label}</Link>)}
        </nav>
      </footer>
    </div>
  )
}
