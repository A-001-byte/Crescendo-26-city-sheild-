import { getSeverityColor } from '../../utils/formatters'

export default function StatusBadge({ severity = 'low', label }) {
  const color = getSeverityColor(severity)
  const text = label || severity.toUpperCase()

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-mono font-semibold"
      style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {text}
    </span>
  )
}
