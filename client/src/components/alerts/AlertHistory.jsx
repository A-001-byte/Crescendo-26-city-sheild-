import { useState } from 'react'
import { Search, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

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
  high: { bg: '#EF4444', text: '#FFFFFF', label: 'HIGH RISK' },
  moderate: { bg: '#EAB308', text: '#FFFFFF', label: 'MEDIUM RISK' },
  low: { bg: '#22C55E', text: '#FFFFFF', label: 'LOW RISK' },
}

function MinimalAlertCard({ a, index }) {
  const cfg = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.low

  return (
    <motion.div
      key={a.id}
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ scale: 1.05 }}
      className="mb-4 rounded-full flex items-center justify-center p-4 shadow-md cursor-default"
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
      }}
    >
      <span className="font-bold tracking-widest text-base text-center">
        {cfg.label} — {a.ward.toUpperCase()}
      </span>
    </motion.div>
  )
}

export default function AlertHistory() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')

  const filtered = HISTORY.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    if (serviceFilter !== 'all' && a.service !== serviceFilter) return false
    if (search && !a.ward.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col h-full" style={{ background: 'transparent' }}>
      {/* Header & Filters */}
      <div
        className="px-4 pt-4 pb-3 rounded-2xl mb-3 flex-shrink-0"
        style={{ background: '#FFFFFF', border: '1px solid #DBEAFE', boxShadow: '0 2px 12px rgba(59,130,246,0.06)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-base" style={{ color: '#0F172A' }}>Alert History</h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
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
              className="w-full text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none transition-shadow"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155' }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="text-xs rounded-xl px-3 py-2 focus:outline-none"
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
            className="text-xs rounded-xl px-3 py-2 focus:outline-none"
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
        {filtered.map((a, i) => (
          <MinimalAlertCard key={a.id} a={a} index={i} />
        ))}
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
