import { useEffect, useRef, useState } from "react"
import { decode, readStored, safeLocalStorage, writeStored } from "../lib/storage.js"

// Zustand mit validiertem, versioniertem Web Storage.
// Geschrieben wird nur nach eigener Änderung (oder um eine Migration abzuschließen) –
// nie beim Laden, damit unlesbare oder neuere Daten nicht still überschrieben werden.
export function useStoredState(schema, storage = safeLocalStorage()) {
  const [initial] = useState(() => storage ? readStored(storage, schema) : { status: "unavailable", value: schema.fallback })
  const [value, setValue] = useState(initial.value)
  const pending = useRef(initial.status === "migrated")
  const writable = storage && initial.status !== "newer" && initial.status !== "unavailable"

  useEffect(() => {
    // Nicht beschreibbar (Status "newer"/"unavailable"): pending bleibt bewusst dauerhaft gesetzt.
    // Kein Bug – writable kann in derselben Sitzung nicht wieder true werden, also wird nie geschrieben.
    if (!pending.current || !writable) return
    pending.current = false
    try {
      writeStored(storage, schema, value)
      if (initial.legacyKey) storage.removeItem(initial.legacyKey)
    } catch { /* Speicher voll oder gesperrt: Wert bleibt bis zum Schließen der Seite erhalten */ }
  }, [value, storage, schema, writable, initial.legacyKey])

  // Änderungen aus anderen Tabs übernehmen – aber nur gültige, und ohne sie zurückzuschreiben.
  useEffect(() => {
    if (!storage) return
    const onStorage = event => {
      if (event.storageArea !== storage) return
      if (event.key === null || (event.key === schema.key && event.newValue === null)) {
        setValue(schema.fallback)
        return
      }
      if (event.key !== schema.key) return
      const result = decode(event.newValue, schema)
      if (result.status === "ok" || result.status === "migrated") setValue(result.value)
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [storage, schema])

  const update = next => {
    pending.current = true
    setValue(next)
  }

  return [value, update, initial.status]
}
