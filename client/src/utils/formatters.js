export function formatRelativeTime(isoDate) {
  if (!isoDate) return 'Unknown'
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diff = now - then

  if (diff < 0) return 'just now'
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 172_800_000) return 'yesterday'
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function formatDate(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' IST'
}

export function formatNumber(n) {
  if (n == null) return '0'
  return Number(n).toLocaleString('en-IN')
}

export function truncate(str, n) {
  if (!str) return ''
  if (str.length <= n) return str
  return str.slice(0, n) + '…'
}

export function getSeverityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'low': return '#10B981'
    case 'moderate': return '#F59E0B'
    case 'high': return '#EF4444'
    case 'critical': return '#DC2626'
    default: return '#94A3B8'
  }
}
