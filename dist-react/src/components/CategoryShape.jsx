import { CATEGORIES } from "../data/institutions.js"

export default function CategoryShape({ category }) {
  const shape = CATEGORIES[category]?.shape
  if (!shape) return null
  return <svg className="category-shape" viewBox="0 0 16 16" aria-hidden="true"><path d={shape} /></svg>
}
