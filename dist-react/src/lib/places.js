import { distance, byDistanceThenName } from "../geo.js"

// Groß-/Kleinschreibung, Akzente und ß ignorieren: „strasse“ findet „Straße“.
export const normalize = text => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/ß/g, "ss").toLocaleLowerCase("de")

// Einmal pro Datensatz aufbauen, nicht pro Tastendruck.
export const indexPlaces = items => items.map(item => ({ item, haystack: normalize(`${item.name} ${item.address} ${item.tags.join(" ")}`) }))

// Eine Quelle für Liste und Karte. Liefert das komplette, sortierte Ergebnis;
// Paginierung oder Virtualisierung setzen später nur in der Darstellung an.
export function selectPlaces(index, { category = "alle", text = "", origin = null } = {}) {
  const needle = normalize(text.trim())
  return index
    .filter(({ item, haystack }) => (category === "alle" || item.category === category) && (!needle || haystack.includes(needle)))
    .map(({ item }) => origin ? { ...item, distance: distance(origin, item) } : item)
    .sort(byDistanceThenName)
}
