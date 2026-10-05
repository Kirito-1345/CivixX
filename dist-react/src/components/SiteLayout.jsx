import { useState } from "react"
import { Link, Outlet } from "react-router-dom"

const LEGAL = [
  { to: "/datenschutz", label: "Datenschutz" },
  { to: "/cookies", label: "Cookies" },
  { to: "/nutzungsbedingungen", label: "Nutzungsbedingungen" }
]

export default function SiteLayout({ children }) {
  const [cookieNotice, setCookieNotice] = useState(() => {
    try {
      return localStorage.getItem("civixx.cookieNotice") !== "accepted"
    } catch {
      return true
    }
  })

  const acceptCookies = () => {
    localStorage.setItem("civixx.cookieNotice", "accepted")
    setCookieNotice(false)
  }

  return (
    <div className="page">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"/><path d="M9 9h6M12 6v6"/></svg>
          </span>
          <span>
            <strong>CivixX</strong>
            <small>Leipzig entdecken</small>
          </span>
        </Link>
        <nav className="header-nav" aria-label="Hauptnavigation">
          <Link to="/">Karte</Link>
          <Link to="/datenschutz">Datenschutz</Link>
        </nav>
      </header>
      {children || <Outlet />}
      {cookieNotice && (
        <div className="cookie-popup" role="dialog" aria-modal="false" aria-labelledby="cookie-title" aria-describedby="cookie-text">
          <div>
            <h2 id="cookie-title">Hinweis</h2>
            <p id="cookie-text">Diese Website verwendet keine Cookies und kein Tracking. Deine Merkliste wird nur lokal gespeichert.</p>
          </div>
          <div className="cookie-actions">
            <button type="button" onClick={acceptCookies}>Verstanden</button>
          </div>
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
