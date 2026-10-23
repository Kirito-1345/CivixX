const NON_BREAKING_SPACE = "\u00A0"

// Zentrale Zahlenformatierung über Intl.NumberFormat statt toFixed/String-Concat.
export function formatNumber(value, options = {}, locale = "de-DE") {
  return new Intl.NumberFormat(locale, options).format(value)
}

// z. B. "850 m" oder "1,2 km" – mit geschütztem Leerzeichen vor der Einheit.
export function formatDistance(meters, locale = "de-DE") {
  if (!Number.isFinite(meters) || meters < 0) return ""

  const useKilometers = meters >= 1000
  const value = useKilometers ? meters / 1000 : meters
  const unit = useKilometers ? "km" : "m"
  const number = formatNumber(value, { maximumFractionDigits: useKilometers ? 1 : 0 }, locale)

  return `${number}${NON_BREAKING_SPACE}${unit}`
}

// z. B. "7 Min." oder "1 Std. 5 Min."
export function formatDuration(seconds, locale = "de-DE") {
  if (!Number.isFinite(seconds) || seconds < 0) return ""
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${formatNumber(minutes, {}, locale)}${NON_BREAKING_SPACE}Min.`
  return `${formatNumber(Math.floor(minutes / 60), {}, locale)}${NON_BREAKING_SPACE}Std. ${formatNumber(minutes % 60, {}, locale)}${NON_BREAKING_SPACE}Min.`
}

// Zweistellig wie im Raster („07“), ab 1.000 mit Tausenderpunkt.
export function formatCount(count, locale = "de-DE") {
  return count < 10 ? `0${count}` : formatNumber(count, {}, locale)
}
