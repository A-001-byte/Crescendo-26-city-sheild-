export function getRiskColor(score) {
  if (score <= 3) return '#16A34A'
  if (score <= 7) return '#EAB308'
  return '#DC2626'
}

export function getRiskLabel(score) {
  if (score <= 3) return 'LOW RISK'
  if (score <= 6) return 'MODERATE RISK'
  if (score <= 8) return 'HIGH RISK'
  return 'CRITICAL'
}

export function getRiskTailwindClass(score) {
  if (score <= 3) return 'text-risk-low'
  if (score <= 6) return 'text-risk-moderate'
  if (score <= 8) return 'text-risk-high'
  return 'text-risk-critical'
}

export function getAlertLevelColor(level) {
  switch (level?.toLowerCase()) {
    case 'green': return '#16A34A'
    case 'yellow':
    case 'orange': return '#EAB308'
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
  if (score <= 3) return 'green'
  if (score <= 5) return 'yellow'
  if (score <= 7) return 'orange'
  return 'red'
}
