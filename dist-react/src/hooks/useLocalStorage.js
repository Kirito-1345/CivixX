import { useEffect, useState } from "react"

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Der lokale Speicher kann deaktiviert sein.
    }
  }, [key, value])

  // Änderungen aus anderen Tabs übernehmen, sonst überschreiben sich die Tabs gegenseitig.
  useEffect(() => {
    const sync = event => {
      if (event.key !== key || !event.newValue) return
      try { setValue(JSON.parse(event.newValue)) } catch { /* fremder Inhalt */ }
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [key])

  return [value, setValue]
}
