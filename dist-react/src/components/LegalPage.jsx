import { Link } from "react-router-dom"
import { useDocumentTitle } from "../hooks/useDocumentTitle.js"

export default function LegalPage({ label = "Rechtliches", title, intro, sections = [], children }) {
  useDocumentTitle(`${title} – CivixX`)
  return (
    <div className="legal-page">
      <header className="legal-head">
        <p className="eyebrow">{label}</p>
        <h1>{title}</h1>
      </header>
      <div className="legal-body">
        <aside className="legal-aside swiss-dots">
          <p className="legal-intro">{intro}</p>
          <Link className="btn btn-secondary" to="/"><span aria-hidden="true">←</span> Zur Karte</Link>
        </aside>
        <article className="legal-sections">
          {sections.map(({ heading, body }, index) => (
            <section key={heading}>
              <span className="legal-no" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h2>{heading}</h2>
              <p>{body}</p>
            </section>
          ))}
          {children}
        </article>
      </div>
    </div>
  )
}
