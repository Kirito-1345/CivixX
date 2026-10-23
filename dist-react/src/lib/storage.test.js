import { describe, expect, test } from "vitest"
import { backupKey, decode, readStored, writeStored } from "./storage.js"
import { FAVORITES } from "../data/favorites.js"

const memory = (entries = {}) => {
  const data = new Map(Object.entries(entries))
  return {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
    data
  }
}

describe("decode", () => {
  test("akzeptiert gültige Daten und entfernt Dubletten", () => {
    expect(decode(JSON.stringify({ v: 3, data: ["a", "a", "b"] }), FAVORITES)).toEqual({ status: "ok", value: ["a", "b"] })
  })

  test("erkennt kaputtes JSON, falsche Form und ungültige Werte", () => {
    expect(decode("{", FAVORITES).status).toBe("corrupt")
    expect(decode("[1,2]", FAVORITES).status).toBe("corrupt")
    expect(decode(JSON.stringify({ v: 3, data: [1] }), FAVORITES).status).toBe("corrupt")
  })

  test("fasst Daten einer neueren Version nicht an", () => {
    expect(decode(JSON.stringify({ v: 4, data: [] }), FAVORITES)).toEqual({ status: "newer" })
  })

  test("migriert schrittweise", () => {
    const schema = { version: 2, validate: data => data, migrations: { 1: data => data.map(id => `x-${id}`) } }
    expect(decode(JSON.stringify({ v: 1, data: ["a"] }), schema)).toEqual({ status: "migrated", value: ["x-a"] })
  })
})

describe("readStored", () => {
  test("sichert unlesbare Daten, statt sie zu überschreiben", () => {
    const storage = memory({ [FAVORITES.key]: "kaputt" })
    expect(readStored(storage, FAVORITES)).toEqual({ status: "corrupt", value: [] })
    expect(storage.getItem(backupKey(FAVORITES.key))).toBe("kaputt")
    expect(storage.getItem(FAVORITES.key)).toBe("kaputt")
  })

  test("überschreibt eine vorhandene Sicherung nicht", () => {
    const storage = memory({ [FAVORITES.key]: "neu kaputt", [backupKey(FAVORITES.key)]: "alt" })
    readStored(storage, FAVORITES)
    expect(storage.getItem(backupKey(FAVORITES.key))).toBe("alt")
  })

  test("übernimmt das Altformat (IDs oder ganze Einträge)", () => {
    const storage = memory({ "civixx.savedPlaces.v2": JSON.stringify(["htwk", { id: "hmt" }]) })
    expect(readStored(storage, FAVORITES)).toEqual({ status: "migrated", value: ["htwk", "hmt"], legacyKey: "civixx.savedPlaces.v2" })
  })

  test("meldet gesperrten Speicher", () => {
    const storage = { getItem() { throw new Error("SecurityError") } }
    expect(readStored(storage, FAVORITES)).toEqual({ status: "unavailable", value: [] })
  })

  test("writeStored schreibt den Umschlag", () => {
    const storage = memory()
    writeStored(storage, FAVORITES, ["htwk"])
    expect(JSON.parse(storage.getItem(FAVORITES.key))).toEqual({ v: 3, data: ["htwk"] })
  })
})
