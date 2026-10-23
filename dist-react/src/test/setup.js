import { afterEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"

// jsdom kennt matchMedia nicht; Standard: keine reduzierte Bewegung.
if (!window.matchMedia) {
  window.matchMedia = query => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
})
