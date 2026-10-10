export const CATEGORIES = {
  schule: { label: "Schulen", color: "#0d7d8c" },
  hochschule: { label: "Hochschulen", color: "#7a4ecb" },
  bibliothek: { label: "Bibliotheken", color: "#b3541e" },
  vhs: { label: "Weiterbildung", color: "#2b7a3b" },
  kita: { label: "Kitas", color: "#c2477a" }
}

// Adressen und Koordinaten gegen OpenStreetMap geprüft (Oktober 2026).
export const INSTITUTIONS = [
  { id: "uni-leipzig", name: "Universität Leipzig", category: "hochschule", address: "Augustusplatz 10, 04109 Leipzig", lat: 51.33905, lng: 12.3792, tags: ["universität", "forschung"] },
  { id: "htwk", name: "HTWK Leipzig", category: "hochschule", address: "Karl-Liebknecht-Straße 132, 04277 Leipzig", lat: 51.31421, lng: 12.37297, tags: ["technik", "hochschule"] },
  { id: "hmt", name: "Hochschule für Musik und Theater", category: "hochschule", address: "Grassistraße 8, 04107 Leipzig", lat: 51.33272, lng: 12.36685, tags: ["musik", "theater"] },
  { id: "stadtbibliothek", name: "Stadtbibliothek Leipzig", category: "bibliothek", address: "Wilhelm-Leuschner-Platz 10-11, 04107 Leipzig", lat: 51.33368, lng: 12.37449, tags: ["bücher", "lesen"] },
  { id: "deutsche-nationalbibliothek", name: "Deutsche Nationalbibliothek", category: "bibliothek", address: "Deutscher Platz 1, 04103 Leipzig", lat: 51.32228, lng: 12.39717, tags: ["archiv", "national"] },
  { id: "vhs-leipzig", name: "Volkshochschule Leipzig", category: "vhs", address: "Löhrstraße 3-7, 04105 Leipzig", lat: 51.34523, lng: 12.37329, tags: ["kurse", "sprachen"] },
  { id: "thomasschule", name: "Thomasschule zu Leipzig", category: "schule", address: "Hillerstraße 7, 04109 Leipzig", lat: 51.33649, lng: 12.35942, tags: ["gymnasium", "thomaner"] },
  { id: "nikolaischule", name: "Neue Nikolaischule", category: "schule", address: "Schönbachstraße 17, 04299 Leipzig", lat: 51.31781, lng: 12.41304, tags: ["gymnasium"] },
  { id: "kita-zwergenland", name: "Kita Zwergenland", category: "kita", address: "Erich-Zeigner-Allee 77, 04229 Leipzig", lat: 51.3235, lng: 12.33724, tags: ["kindergarten"] },
  { id: "kita-casa-monte", name: "Kita Casa Monte", category: "kita", address: "Wilhelm-Sammet-Straße 4, 04129 Leipzig", lat: 51.36197, lng: 12.38066, tags: ["kindergarten"] },
  { id: "kita-kleine-fuechse", name: "Kita Kleine Füchse", category: "kita", address: "Frohburger Straße 33C, 04277 Leipzig", lat: 51.31106, lng: 12.38229, tags: ["kindergarten"] },
  { id: "kindergarten-st-nikolai", name: "Kindergarten St. Nikolai", category: "kita", address: "Lange Straße 23, 04103 Leipzig", lat: 51.34152, lng: 12.39337, tags: ["kindergarten"] }
]
