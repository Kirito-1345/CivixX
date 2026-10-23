import { Link } from "react-router-dom"
import CategoryShape from "./CategoryShape.jsx"
import { formatDistance } from "../utils/format.js"

// Darstellung einer bereits gefilterten Liste. Bei deutlich mehr Einträgen
// (> 50) hier virtualisieren oder paginieren – Datenfluss und Karte bleiben gleich.
export default function PlaceList({ items, selectedId, hrefFor, compact = false, className, label, empty }) {
  return (
    <ul className={`place-list ${className}`} aria-label={label}>
      {items.map(item => (
        <li key={item.id}>
          <Link className="place-row" to={hrefFor(item)} preventScrollReset aria-current={selectedId === item.id ? "true" : undefined}>
            <CategoryShape category={item.category} />
            {compact ? <strong>{item.name}</strong> : (
              <span>
                <strong>{item.name}</strong>
                <small>{item.address}</small>
              </span>
            )}
            {!compact && item.distance !== undefined && <em>{formatDistance(item.distance * 1000)}</em>}
          </Link>
        </li>
      ))}
      {!items.length && <li className="empty">{empty}</li>}
    </ul>
  )
}
