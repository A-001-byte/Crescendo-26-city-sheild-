import { useMemo, useState } from 'react'
import { Search, CheckCircle } from 'lucide-react'
import { useCrisis } from '../../context/CrisisContext'

const HISTORY = [
  { id: 'h1', severity: 'high', ward: 'Katraj', service: 'fuel', message: 'test' },
  { id: 'h2', severity: 'high', ward: 'Hadapsar', service: 'logistics', message: 'test' },
  { id: 'h3', severity: 'moderate', ward: 'Swargate', service: 'food', message: 'test' },
  { id: 'h4', severity: 'moderate', ward: 'Pimpri', service: 'power', message: 'test' },
  { id: 'h5', severity: 'low', ward: 'Kothrud', service: 'fuel', message: 'test' },
  { id: 'h6', severity: 'high', ward: 'All Wards', service: 'fuel', message: 'test' },
  { id: 'h7', severity: 'moderate', ward: 'Chinchwad', service: 'food', message: 'test' },
  { id: 'h8', severity: 'low', ward: 'Aundh', service: 'power', message: 'test' },
  { id: 'h9', severity: 'high', ward: 'Katraj', service: 'fuel', message: 'test' },
  { id: 'h10', severity: 'moderate', ward: 'Hinjewadi', service: 'logistics', message: 'test' },
]

const SEVERITY_CONFIG = {
  high: { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', label: 'HIGH', score: 8 },
  moderate: { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D', label: 'MEDIUM', score: 5 },
  low: { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', label: 'LOW', score: 2 },
}

function MinimalAlertCard({ a, index }) {
  const cfg = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.low

  return (
    <div
      key={a.id}
      className="max-w-md mx-auto w-full flex items-center justify-between p-3 border"
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
        borderColor: cfg.border,
      }}
    >
      <span className="font-bold text-sm tracking-wide">{a.ward.toUpperCase()}</span>
      <span className="font-bold text-sm">{cfg.label}</span>
      <span className="font-bold text-sm">{cfg.score}</span>
    </div>
  )
}

export default function AlertHistory() {
  const { alerts } = useCrisis()
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')

  const items = useMemo(() => {
    const source = alerts?.length ? alerts : HISTORY
    return source.map((a, index) => {
      const severity = (a.severity || a.level || 'low').toLowerCase()
      const normalizedSeverity = ['high', 'moderate', 'low'].includes(severity) ? severity : 'low'
      return {
        id: a.id || `h-${index}`,
        severity: normalizedSeverity,
        ward: a.ward || a.area || 'All Wards',
        service: a.service || a.category || 'fuel',
        message: a.message || '',
      }
    })
  }, [alerts])

  const filtered = items.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    if (serviceFilter !== 'all' && a.service !== serviceFilter) return false
    if (search && !a.ward.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col h-full" style={{ background: 'transparent' }}>
      {/* Header & Filters */}
      <div
        className="px-4 pt-4 pb-3 mb-3 flex-shrink-0 shadow-sm"
        style={{ background: '#FFFFFF', border: '1px solid #DBEAFE' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-base tracking-wide uppercase" style={{ color: '#0F172A' }}>Alert History</h3>
          <span className="text-xs font-mono px-2 py-0.5" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
            {filtered.length} records
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search area..."
              className="w-full text-xs pl-8 pr-3 py-2 focus:outline-none"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155' }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="text-xs px-3 py-2 focus:outline-none"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155' }}
          >
            <option value="all">All Severity</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
            className="text-xs px-3 py-2 focus:outline-none"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155' }}
          >
            <option value="all">All Services</option>
            <option value="fuel">Fuel</option>
            <option value="power">Power</option>
            <option value="food">Food</option>
            <option value="logistics">Logistics</option>
          </select>
        </div>
      </div>

      {/* Notification Cards */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a, i) => (
            <MinimalAlertCard key={a.id} a={a} index={i} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94A3B8' }}>
            <CheckCircle className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No alerts match your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
