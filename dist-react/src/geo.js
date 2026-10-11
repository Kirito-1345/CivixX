// Entfernung in km; für Abstände innerhalb einer Stadt genau genug.
export const distance = (a, b) => {
  const x = Math.cos((a.lat + b.lat) * Math.PI / 360) * (a.lng - b.lng)
  const y = a.lat - b.lat
  return 111.32 * Math.hypot(x, y)
}

// Nächste zuerst; ohne Entfernung (oder bei Gleichstand) alphabetisch.
export const byDistanceThenName = (a, b) =>
  (a.distance ?? Infinity) - (b.distance ?? Infinity) || a.name.localeCompare(b.name, "de")
