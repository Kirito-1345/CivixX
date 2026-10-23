// Speicherschema der Favoriten. Version 3 = Umschlag { v, data: string[] }.
// Version 2 lag ohne Umschlag unter „civixx.savedPlaces.v2“ (IDs oder ganze Einträge).
const MAX_FAVORITES = 500

const validate = data => {
  if (!Array.isArray(data) || data.length > MAX_FAVORITES) return undefined
  if (!data.every(id => typeof id === "string" && id.length > 0 && id.length <= 100)) return undefined
  return [...new Set(data)] // unbekannte IDs bleiben erhalten, angezeigt wird nur, was es gibt
}

export const FAVORITES = {
  key: "civixx.favorites",
  version: 3,
  fallback: [],
  validate,
  migrations: {},
  legacy: [{
    key: "civixx.savedPlaces.v2",
    migrate: data => Array.isArray(data) ? data.map(entry => typeof entry === "string" ? entry : entry?.id) : undefined
  }]
}
