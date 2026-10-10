export default function Privacy() {
  return (
    <main className="legal-page">
      <article>
        <p className="eyebrow">Rechtliches</p>
        <h1>Datenschutzerklärung</h1>
        <p className="legal-intro">Diese Seite nutzt nur die technisch notwendigen Dienste für Karte, Suche und lokale Speicherung.</p>
        <section><h2>Verantwortliche Stelle</h2><p>Dies ist eine private Hobby-Seite. Der Betreiber ist Julius Bruckner.</p></section>
        <section><h2>Datenverarbeitung auf dieser Seite</h2><p>Diese Website setzt keine Cookies, kein Tracking und keine Analyse-Tools ein.</p></section>
        <section><h2>Adresssuche</h2><p>Wenn du eine Adresse suchst, wird dein Suchbegriff an den öffentlichen Dienst Nominatim der OpenStreetMap Foundation gesendet. Die Verarbeitung erfolgt zur Bereitstellung der angeforderten Funktion.</p></section>
        <section><h2>Standortfunktion</h2><p>Die Standortabfrage erfolgt nur nach ausdrücklichem Klick auf „Standort“ über die Geolocation-API deines Browsers. Der Standort wird im Browser verwendet und nur dann an Dritte gesendet, wenn du eine Route von oder zu deinem Standort berechnen lässt.</p></section>
        <section><h2>Routen</h2><p>Wenn du auf „Route hierher“ klickst, werden die Koordinaten von Start und Ziel sowie deine IP-Adresse an den öffentlichen Routing-Dienst OSRM (router.project-osrm.org) gesendet. Das kann auch dein Standort sein, wenn er der Startpunkt ist.</p></section>
        <section><h2>Kartendaten</h2><p>Die Karte nutzt Kacheln von OpenStreetMap. Beim Laden werden deine IP-Adresse und technische Anfragedaten an die Server von OpenStreetMap übertragen.</p></section>
        <section><h2>Gemerkte Orte</h2><p>Gemerkte Orte werden im lokalen Speicher deines Browsers gespeichert. Sie werden nicht an Dritte übertragen. Eine Anmeldung und Synchronisierung sind nicht aktiviert.</p></section>
        <section><h2>Deine Rechte</h2><p>Du hast jederzeit das Recht auf Auskunft, Berichtigung oder Löschung deiner gespeicherten Daten. Diese Seite speichert keine Nutzerdaten auf einem Server.</p></section>
      </article>
    </main>
  )
}
