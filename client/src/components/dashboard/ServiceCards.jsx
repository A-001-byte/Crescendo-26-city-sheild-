// Service category dot color + label — no Material Symbols (avoids font-glyph overlap)
const SERVICES = [
  { key: 'fuel',      label: 'Fuel Supply',  dot: '#ef4444' },
  { key: 'power',     label: 'Power Grid',   dot: '#f59e0b' },
  { key: 'food',      label: 'Food Chain',   dot: '#22c55e' },
  { key: 'logistics', label: 'Logistics',    dot: '#6366f1' },
]

const band = (score) => {
  if (!Number.isFinite(Number(score))) return 'unknown'
  return score > 7 ? 'high' : score > 4.5 ? 'medium' : 'low'
}

const BAND = {
  high:   { label: 'HIGH', bar: '#ef4444', badge: 'rgba(239,68,68,0.10)',   text: '#ef4444' },
  medium: { label: 'MED',  bar: '#f59e0b', badge: 'rgba(245,158,11,0.10)',  text: '#b45309' },
  low:    { label: 'LOW',  bar: '#22c55e', badge: 'rgba(34,197,94,0.10)',   text: '#15803d' },
  unknown:{ label: 'NA',   bar: '#cbd5f5', badge: 'rgba(148,163,184,0.14)', text: '#64748b' },
}

function ServiceCard({ service, data }) {
  const rawScore = data?.score
  const score = Number.isFinite(Number(rawScore)) ? Number(rawScore) : null
  const pct = score == null ? 0 : Math.max(0, Math.min(100, (score / 10) * 100))
  const cfg   = BAND[band(score)]

  return (
    <div className="flex flex-col gap-2.5 pt-4 pb-5 border-b border-outline-variant/20 w-full">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Colored category dot */}
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: service.dot }}
          />
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-secondary truncate">
            {service.label}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span
            className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: cfg.badge, color: cfg.text }}
          >
            {cfg.label}
          </span>
          <span
            className="text-lg font-extrabold tabular-nums tracking-tight"
            style={{ color: cfg.text }}
          >
            {score == null ? 'NA' : score.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] w-full rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: cfg.bar }}
        />
      </div>
    </div>
  )
}

export default function ServiceCards({ data }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0">
      {SERVICES.map((s) => (
        <ServiceCard key={s.key} service={s} data={data?.[s.key]} />
      ))}
    </div>
  )
}
