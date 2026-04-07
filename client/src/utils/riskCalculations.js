export const RISK_BANDS = {
  lowMax: 3,
  mediumMax: 5,
  highMax: 7,
  criticalMax: 10,
}

export function getRiskBand(score) {
  const s = Number(score)
  if (!Number.isFinite(s)) return 'unknown'
  if (s <= RISK_BANDS.lowMax) return 'low'
  if (s <= RISK_BANDS.mediumMax) return 'medium'
  if (s <= RISK_BANDS.highMax) return 'high'
  return 'critical'
}

export function getRiskColor(score) {
  const band = getRiskBand(score)
  if (band === 'low') return '#16A34A'
  if (band === 'medium') return '#EAB308'
  if (band === 'high') return '#DC2626'
  if (band === 'critical') return '#DC2626'
  return '#94A3B8'
}

export function getRiskLabel(score) {
  const band = getRiskBand(score)
  if (band === 'low') return 'LOW RISK'
  if (band === 'medium') return 'MEDIUM RISK'
  if (band === 'high') return 'HIGH RISK'
  if (band === 'critical') return 'CRITICAL RISK'
  return 'UNKNOWN'
}

export function getRiskTailwindClass(score) {
  const band = getRiskBand(score)
  if (band === 'low') return 'text-risk-low'
  if (band === 'medium') return 'text-risk-moderate'
  if (band === 'high') return 'text-risk-high'
  if (band === 'critical') return 'text-risk-critical'
  return 'text-text-muted'
}

export function getAlertLevelColor(level) {
  switch (level?.toLowerCase()) {
    case 'green': return '#16A34A'
    case 'yellow': return '#EAB308'
    case 'orange': return '#F97316'
    case 'red': return '#DC2626'
    default: return '#94A3B8'
  }
}

export function scoreToAngle(score) {
  // Maps score 1-10 to 0-240 degrees
  const clamped = Math.max(1, Math.min(10, score))
  return ((clamped - 1) / 9) * 240
}

export function getAlertLevelFromScore(score) {
  const band = getRiskBand(score)
  if (band === 'low') return 'green'
  if (band === 'medium') return 'yellow'
  if (band === 'high') return 'orange'
  if (band === 'critical') return 'red'
  return 'yellow'
}
