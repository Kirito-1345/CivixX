import { useSyncExternalStore } from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

const subscribe = callback => {
  const media = window.matchMedia?.(QUERY)
  media?.addEventListener("change", callback)
  return () => media?.removeEventListener("change", callback)
}

export const prefersReducedMotion = () => window.matchMedia?.(QUERY).matches ?? false

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}
