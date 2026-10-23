import { Component } from "react"

// Fängt Fehler der Karte (inkl. nicht ladbarem Karten-Chunk) ab; Liste, Suche und Favoriten bleiben nutzbar.
export default class MapErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error("Karte:", error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="map map-fallback swiss-diagonal" role="alert">
        <p>Die Karte konnte nicht geladen werden. Liste, Suche und Favoriten funktionieren weiter.</p>
        <button className="btn btn-secondary" type="button" onClick={() => this.setState({ error: null })}>Karte neu laden</button>
      </div>
    )
  }
}
