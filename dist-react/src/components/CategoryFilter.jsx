import { CATEGORIES } from "../data/institutions.js"
import CategoryShape from "./CategoryShape.jsx"

const OPTIONS = [...Object.entries(CATEGORIES).map(([value, { label }]) => ({ value, label })), { value: "alle", label: "Alle" }]

// Einfachauswahl = native Radiogruppe: Gruppenlabel, Pfeiltasten und checked-Status kommen vom Browser.
export default function CategoryFilter({ value, onChange }) {
  return (
    <fieldset className="category-filter">
      <legend className="sr-only">Nach Kategorie filtern</legend>
      <div className="category-options">
        {OPTIONS.map(option => (
          <label key={option.value} className="category-option">
            <input type="radio" name="kategorie" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <CategoryShape category={option.value} />{option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
