// Links auf fremde Seiten: rel gegen Tabnabbing/Referrer, Hinweis für Screenreader und Sehende.
export default function ExternalLink({ href, children, ...props }) {
  return (
    <a href={href} rel="noopener noreferrer" {...props}>
      {children} <span className="external-mark" aria-hidden="true">↗</span><span className="sr-only">(verlässt CivixX)</span>
    </a>
  )
}
