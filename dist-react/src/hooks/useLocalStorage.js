import { useEffect, useState } from "react"

export function readStored(key, initialValue) {
  try {
    const saved = localStorage.getItem(key)
    const parsed = saved ? JSON.parse(saved) : initialValue
    // Kaputte Daten (z. B. null statt Liste) würden die App beim Start abstürzen lassen.
    return Array.isArray(initialValue) && !Array.isArray(parsed) ? initialValue : parsed
  } catch {
    return initialValue
  }
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readStored(key, initialValue))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Der lokale Speicher kann deaktiviert sein.
    }
  }, [key, value])

  // Änderungen aus anderen Tabs übernehmen, sonst überschreiben sich zwei Tabs gegenseitig.
  useEffect(() => {
    const sync = event => { if (event.key === key) setValue(readStored(key, initialValue)) }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [key, initialValue])

  return [value, setValue]
}
