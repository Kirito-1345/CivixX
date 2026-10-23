// Kleiner LRU-Cache mit Ablaufzeit und Obergrenze, optional in Web Storage gespiegelt.
// Wächst nie unbegrenzt: max Einträge, abgelaufene fliegen beim Laden und Lesen raus.
const VERSION = 1

export function createCache({ storage = null, key, ttl, max, validate = () => true, now = Date.now }) {
  let entries = null

  const load = () => {
    if (entries) return entries
    entries = new Map()
    try {
      const parsed = JSON.parse(storage?.getItem(key) ?? "null")
      if (parsed?.v !== VERSION || !Array.isArray(parsed.data)) return entries
      for (const entry of parsed.data.slice(-max)) {
        const [entryKey, record] = Array.isArray(entry) ? entry : []
        if (typeof entryKey === "string" && record?.expires > now() && validate(record.value)) entries.set(entryKey, record)
      }
    } catch { /* Cache ist verzichtbar */ }
    return entries
  }

  const persist = () => {
    if (!storage) return
    let data = [...entries]
    while (data.length) {
      try { storage.setItem(key, JSON.stringify({ v: VERSION, data })); return } catch {
        data = data.slice(Math.ceil(data.length / 2)) // Speicher voll: ältere Hälfte opfern
      }
    }
    try { storage.removeItem(key) } catch { /* nichts zu tun */ }
  }

  return {
    get(entryKey) {
      const record = load().get(entryKey)
      if (!record) return undefined
      entries.delete(entryKey)
      if (record.expires <= now()) { persist(); return undefined }
      entries.set(entryKey, record) // zuletzt genutzt nach hinten
      return record.value
    },
    set(entryKey, value) {
      load().delete(entryKey)
      entries.set(entryKey, { value, expires: now() + ttl })
      while (entries.size > max) entries.delete(entries.keys().next().value)
      persist()
    },
    get size() { return load().size }
  }
}
