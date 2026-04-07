export function getRiskColor(score) {
  if (score <= 3) return '#10B981'
  if (score <= 6) return '#F59E0B'
  if (score <= 8) return '#EF4444'
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
    case 'green': return '#10B981'
    case 'yellow': return '#F59E0B'
    case 'orange': return '#F97316'
    case 'red': return '#EF4444'
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
