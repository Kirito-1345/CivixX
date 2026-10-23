// Versionierter Umschlag { v, data } für localStorage.
// Regeln: Daten vor Nutzung validieren, Unlesbares sichern statt überschreiben,
// Daten einer neueren App-Version nie anfassen, Migrationen Schritt für Schritt.

export const backupKey = key => `${key}.backup`

export function decode(raw, schema) {
  if (raw == null) return { status: "empty" }
  let parsed
  try { parsed = JSON.parse(raw) } catch { return { status: "corrupt" } }
  if (!parsed || typeof parsed !== "object" || !Number.isInteger(parsed.v) || !("data" in parsed)) return { status: "corrupt" }
  if (parsed.v > schema.version) return { status: "newer" }
  let { v, data } = parsed
  try {
    while (v < schema.version) {
      const step = schema.migrations?.[v]
      if (!step) return { status: "corrupt" }
      data = step(data)
      v += 1
    }
  } catch { return { status: "corrupt" } }
  const value = schema.validate(data)
  if (value === undefined) return { status: "corrupt" }
  return { status: parsed.v === schema.version ? "ok" : "migrated", value }
}

export const encode = (value, schema) => JSON.stringify({ v: schema.version, data: value })

function backup(storage, key, raw) {
  try {
    if (storage.getItem(backupKey(key)) == null) storage.setItem(backupKey(key), raw)
  } catch { /* Sicherung ist best effort */ }
}

// Liefert immer einen nutzbaren Wert; status sagt, wie er zustande kam.
export function readStored(storage, schema) {
  let raw
  try { raw = storage.getItem(schema.key) } catch { return { status: "unavailable", value: schema.fallback } }

  if (raw == null) {
    for (const legacy of schema.legacy ?? []) {
      let legacyRaw
      try { legacyRaw = storage.getItem(legacy.key) } catch { continue }
      if (legacyRaw == null) continue
      try {
        const value = schema.validate(legacy.migrate(JSON.parse(legacyRaw)))
        if (value !== undefined) return { status: "migrated", value, legacyKey: legacy.key }
      } catch { /* unten als defekt behandeln */ }
      backup(storage, legacy.key, legacyRaw)
      return { status: "corrupt", value: schema.fallback }
    }
    return { status: "empty", value: schema.fallback }
  }

  const result = decode(raw, schema)
  if (result.status === "corrupt") backup(storage, schema.key, raw)
  if (result.status === "corrupt" || result.status === "newer") return { status: result.status, value: schema.fallback }
  return result
}

export function writeStored(storage, schema, value) {
  storage.setItem(schema.key, encode(value, schema))
}

export function safeLocalStorage() {
  try { return window.localStorage } catch { return null }
}
