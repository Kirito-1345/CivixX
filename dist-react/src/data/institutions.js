// shape: SVG-Pfad im 16×16-Raster – Kategorien werden über Form statt Farbe unterschieden.
export const CATEGORIES = {
  schule: { label: "Schulen", shape: "M2 2h12v12H2z" },
  hochschule: { label: "Hochschulen", shape: "M8 1.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13z" },
  bibliothek: { label: "Bibliotheken", shape: "M8 1.5L15 14H1z" },
  vhs: { label: "Weiterbildung", shape: "M8 .5L15.5 8L8 15.5L.5 8z" },
  kita: { label: "Kitas", shape: "M6 1h4v5h5v4h-5v5H6v-5H1V6h5z" }
}

export const INSTITUTIONS = [
  { id: "uni-leipzig", name: "Universität Leipzig", category: "hochschule", address: "Augustusplatz 10, 04109 Leipzig", lat: 51.33853, lng: 12.37946, tags: ["universität", "forschung"] },
  { id: "htwk", name: "HTWK Leipzig", category: "hochschule", address: "Karl-Liebknecht-Straße 132, 04277 Leipzig", lat: 51.3134, lng: 12.37368, tags: ["technik", "hochschule"] },
  { id: "hmt", name: "Hochschule für Musik und Theater", category: "hochschule", address: "Grassistraße 8, 04107 Leipzig", lat: 51.33272, lng: 12.36685, tags: ["musik", "theater"] },
  { id: "stadtbibliothek", name: "Stadtbibliothek Leipzig", category: "bibliothek", address: "Wilhelm-Leuschner-Platz 10-11, 04107 Leipzig", lat: 51.33368, lng: 12.37449, tags: ["bücher", "lesen"] },
  { id: "deutsche-nationalbibliothek", name: "Deutsche Nationalbibliothek", category: "bibliothek", address: "Deutscher Platz 1, 04103 Leipzig", lat: 51.32228, lng: 12.39718, tags: ["archiv", "national"] },
  { id: "vhs-leipzig", name: "Volkshochschule Leipzig", category: "vhs", address: "Löhrs Carré, Löhrstraße 3-7, 04105 Leipzig", lat: 51.34523, lng: 12.37329, tags: ["kurse", "sprachen"] },
  { id: "thomasschule", name: "Thomasschule zu Leipzig", category: "schule", address: "Hillerstraße 7, 04109 Leipzig", lat: 51.33649, lng: 12.35942, tags: ["gymnasium", "thomaner"] },
  { id: "nikolaischule", name: "Neue Nikolaischule", category: "schule", address: "Schönbachstraße 17, 04299 Leipzig", lat: 51.31781, lng: 12.41304, tags: ["gymnasium"] },
  { id: "schule-auensee", name: "Schule am Auensee", category: "schule", address: "Stahmelner Straße 1, 04159 Leipzig", lat: 51.37305, lng: 12.3215, tags: ["grundschule"] },
  { id: "kita-regenbogen", name: "Kita Im Regenbogenland", category: "kita", address: "Reichelstraße 3/5, 04109 Leipzig", lat: 51.3371, lng: 12.36803, tags: ["kindergarten"] },
  { id: "kita-suedvorstadt", name: "Kita Tillj", category: "kita", address: "Lößniger Straße 21, 04275 Leipzig", lat: 51.3212, lng: 12.38198, tags: ["kindergarten"] }
]
