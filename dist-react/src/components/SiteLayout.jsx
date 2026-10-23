import { useEffect, useRef } from "react"
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from "react-router-dom"
import ExternalLink from "./ExternalLink.jsx"

const NAV = [
  { to: "/", label: "Karte" },
  { to: "/datenschutz", label: "Datenschutz" }
]

const LEGAL = [
  { to: "/datenschutz", label: "Datenschutz" },
  { to: "/cookies", label: "Cookies" },
  { to: "/nutzungsbedingungen", label: "Nutzungsbedingungen" }
]

// Scrollposition pro Pfad: Query-Änderungen (Filter, Auswahl) springen nicht nach oben.
const scrollKey = location => location.pathname

export default function SiteLayout() {
  const { pathname } = useLocation()
  const mainRef = useRef(null)
  const firstRender = useRef(true)

  // Nach Seitenwechsel Fokus auf den Inhalt, damit Screenreader die neue Seite ansagen.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  const skipToMain = event => {
    event.preventDefault() // kein Hash in der URL, Query-Zustand bleibt
    mainRef.current?.focus()
  }

  return (
    <div className="page">
      <a className="skip-link" href="#main" onClick={skipToMain}>Zum Inhalt springen</a>
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"/><path d="M9 9h6M12 6v6"/></svg>
          </span>
          <span>
            <strong translate="no">CivixX</strong>
            <small>Bildung entdecken</small>
          </span>
        </Link>
        <nav className="header-nav" aria-label="Hauptnavigation">
          {NAV.map(item => (
            <NavLink key={item.to} className="nav-link" to={item.to} end>{item.label}</NavLink>
          ))}
        </nav>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-main">
          <p className="footer-mark" aria-hidden="true" translate="no">CivixX</p>
          <p className="footer-note">Eine Karte von <ExternalLink href="https://www.civixx.de/" translate="no">civixx.de</ExternalLink> · Kartendaten © <span translate="no">OpenStreetMap</span>-Mitwirkende</p>
        </div>
        <nav aria-label="Rechtliches">
          {LEGAL.map(item => <Link key={item.to} to={item.to}>{item.label}</Link>)}
        </nav>
      </footer>
      <ScrollRestoration getKey={scrollKey} />
    </div>
  )
}
