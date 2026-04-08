import { useEffect, useMemo, useState } from 'react'
import { useCrisis } from '../../context/CrisisContext'
import { fetchAlerts } from '../../utils/api'

const SEV = {
  high:     { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444', label: 'HIGH' },
  moderate: { bg: '#fffbeb', text: '#b45309', border: '#fde68a', dot: '#f59e0b', label: 'MED'  },
  low:      { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#22c55e', label: 'LOW'  },
}

const SERVICE_COLORS = {
  fuel: '#ef4444', power: '#f59e0b', food: '#22c55e', logistics: '#6366f1',
}

function AlertCard({ a }) {
  const cfg = SEV[a.severity] || SEV.low
  const svcColor = SERVICE_COLORS[a.service] || '#94a3b8'

  return (
    <div
      className="flex items-center justify-between gap-3 p-4 rounded-2xl border"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
        <div className="min-w-0">
          <div className="text-sm font-extrabold uppercase tracking-wide truncate" style={{ color: cfg.text }}>
            {a.ward}
          </div>
          <div
            className="text-[10px] font-extrabold uppercase tracking-widest mt-0.5"
            style={{ color: svcColor }}
          >
            {a.service}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ background: cfg.border, color: cfg.text }}
        >
          {cfg.label}
        </span>
      </div>
    </div>
  )
}

export default function AlertHistory() {
  const { alerts } = useCrisis()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')

  useEffect(() => {
    let mounted = true
    fetchAlerts('all')
      .then((data) => { if (mounted && Array.isArray(data)) setHistory(data) })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const items = useMemo(() => {
    const source = history.length ? history : (alerts || [])
    return source.map((a, i) => {
      const rawSev = String(a.severity || a.level || 'low').toLowerCase()
      const sevMap = { red: 'high', orange: 'moderate', yellow: 'moderate', green: 'low' }
      const sev = ['high', 'moderate', 'low'].includes(rawSev) ? rawSev : (sevMap[rawSev] || 'low')
      return {
        id: a.id || `h-${i}`,
        severity: sev,
        ward: a.ward || a.area || 'All Wards',
        service: a.service || a.category || 'fuel',
        message: a.message || '',
      }
    })
  }, [history, alerts])

  const filtered = items.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    if (serviceFilter !== 'all' && a.service !== serviceFilter) return false
    if (search && !a.ward.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const selectCls = 'text-[11px] font-semibold px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low text-primary focus:outline-none focus:border-primary/40 transition-colors'

  return (
    <div
      className="flex flex-col h-full rounded-3xl overflow-hidden"
      style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-outline-variant/20 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-primary">Alert History</h3>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-surface-container-low text-secondary">
            {filtered.length} records
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-36">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary select-none" style={{ fontSize: 15 }}>search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ward…"
              className="w-full text-[11px] pl-9 pr-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low text-primary placeholder:text-secondary/50 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={selectCls}>
            <option value="all">All Severity</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className={selectCls}>
            <option value="all">All Services</option>
            <option value="fuel">Fuel</option>
            <option value="power">Power</option>
            <option value="food">Food</option>
            <option value="logistics">Logistics</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
        {loading ? (
          <div className="text-xs text-secondary text-center py-10">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-secondary">
            <span className="material-symbols-outlined text-4xl mb-3 opacity-30">check_circle</span>
            <p className="text-sm font-semibold">No alerts match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((a) => <AlertCard key={a.id} a={a} />)}
          </div>
        )}
      </div>
    </div>
  )
}
