// shape: SVG-Pfad im 16×16-Raster – Kategorien werden über Form statt Farbe unterschieden.
export const CATEGORIES = {
  schule: { label: "Schulen", shape: "M2 2h12v12H2z" },
  hochschule: { label: "Hochschulen", shape: "M8 1.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13z" },
  bibliothek: { label: "Bibliotheken", shape: "M8 1.5L15 14H1z" },
  vhs: { label: "Weiterbildung", shape: "M8 .5L15.5 8L8 15.5L.5 8z" },
  kita: { label: "Kitas", shape: "M6 1h4v5h5v4h-5v5H6v-5H1V6h5z" }
}

export const INSTITUTIONS = [
  { id: "uni-leipzig", name: "Universität Leipzig", category: "hochschule", address: "Augustusplatz 10, 04109 Leipzig", lat: 51.33974, lng: 12.38008, tags: ["universität", "forschung"] },
  { id: "htwk", name: "HTWK Leipzig", category: "hochschule", address: "Karl-Liebknecht-Straße 132, 04277 Leipzig", lat: 51.31341, lng: 12.37268, tags: ["technik", "hochschule"] },
  { id: "hmt", name: "Hochschule für Musik und Theater", category: "hochschule", address: "Grassistraße 8, 04107 Leipzig", lat: 51.33212, lng: 12.37538, tags: ["musik", "theater"] },
  { id: "stadtbibliothek", name: "Stadtbibliothek Leipzig", category: "bibliothek", address: "Wilhelm-Leuschner-Platz 10-11, 04107 Leipzig", lat: 51.33704, lng: 12.37772, tags: ["bücher", "lesen"] },
  { id: "deutsche-nationalbibliothek", name: "Deutsche Nationalbibliothek", category: "bibliothek", address: "Deutscher Platz 1, 04103 Leipzig", lat: 51.32303, lng: 12.39557, tags: ["archiv", "national"] },
  { id: "vhs-leipzig", name: "Volkshochschule Leipzig", category: "vhs", address: "Löhrs Carré, Löhrstraße 3-7, 04105 Leipzig", lat: 51.34634, lng: 12.36855, tags: ["kurse", "sprachen"] },
  { id: "thomasschule", name: "Thomasschule zu Leipzig", category: "schule", address: "Schreberstraße 9, 04109 Leipzig", lat: 51.33795, lng: 12.35386, tags: ["gymnasium", "thomaner"] },
  { id: "nikolaischule", name: "Nikolaischule Leipzig", category: "schule", address: "Nikolaistraße 3, 04109 Leipzig", lat: 51.33954, lng: 12.3762, tags: ["gymnasium"] },
  { id: "schule-auensee", name: "Grundschule Auensee", category: "schule", address: "Gustav-Esche-Straße 21, 04159 Leipzig", lat: 51.35716, lng: 12.31431, tags: ["grundschule"] },
  { id: "kita-regenbogen", name: "Kita Regenbogen", category: "kita", address: "Karl-Heine-Straße 93, 04229 Leipzig", lat: 51.32885, lng: 12.32205, tags: ["krippe", "kindergarten"] },
  { id: "kita-suedvorstadt", name: "Kita Südvorstadt", category: "kita", address: "Karl-Liebknecht-Straße 74, 04275 Leipzig", lat: 51.32339, lng: 12.37417, tags: ["krippe"] },
  { id: "gbs-leipzig", name: "Leipziger Akademie für Weiterbildung", category: "vhs", address: "Dittrichring 6, 04109 Leipzig", lat: 51.33931, lng: 12.36987, tags: ["weiterbildung", "zertifikate"] }
]
