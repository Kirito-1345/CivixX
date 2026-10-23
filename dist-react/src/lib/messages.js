// Fehlertexte: was ist passiert, und was als Nächstes tun.
const EXAMPLE = "„Augustusplatz 10“"

const SERVICE = {
  offline: what => `Keine Internetverbindung. Verbindung herstellen und ${what} erneut starten.`,
  network: what => `Dienst nicht erreichbar. Verbindung prüfen und ${what} erneut starten.`,
  "rate-limit": what => `Zu viele Anfragen. Einige Sekunden warten und ${what} erneut starten.`,
  server: what => `Der Dienst antwortet gerade nicht. ${what[0].toUpperCase()}${what.slice(1)} später erneut starten.`
}

export const searchMessages = {
  empty: `Suchbegriff eingeben, z. B. ${EXAMPLE}.`,
  notFound: query => `Keine Adresse zu „${query}“ in Leipzig gefunden. Straße mit Hausnummer eingeben, z. B. ${EXAMPLE}.`,
  found: "Adresse gefunden. Liste nach Entfernung sortiert.",
  error: error => (SERVICE[error?.kind] ?? SERVICE.network)("die Suche")
}

export const routeMessages = {
  noStart: "Erst Startpunkt festlegen: „Standort“ wählen oder Punkt auf der Karte setzen.",
  error: error => error?.kind === "no-route"
    ? "Keine Route gefunden. Startpunkt näher an eine Straße setzen und erneut versuchen."
    : (SERVICE[error?.kind] ?? SERVICE.network)("die Routenberechnung")
}

export const geoMessages = {
  unsupported: "Dein Browser kann den Standort nicht ermitteln. Startpunkt stattdessen auf der Karte setzen.",
  outside: "Dein Standort liegt außerhalb von Leipzig. Startpunkt stattdessen auf der Karte setzen.",
  found: "Standort gefunden. Liste nach Entfernung sortiert.",
  error: error => ({
    1: "Standortfreigabe abgelehnt. In den Browsereinstellungen erlauben oder Startpunkt auf der Karte setzen.",
    3: "Standortabfrage dauert zu lange. Erneut versuchen oder Startpunkt auf der Karte setzen."
  })[error?.code] ?? "Standort nicht verfügbar. Erneut versuchen oder Startpunkt auf der Karte setzen."
}
