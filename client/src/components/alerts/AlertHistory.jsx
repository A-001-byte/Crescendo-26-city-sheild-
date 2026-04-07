import { useState } from 'react'
import { formatDate, formatRelativeTime, getSeverityColor } from '../../utils/formatters'
import StatusBadge from '../common/StatusBadge'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'

const HISTORY = [
  { id: 'h1', severity: 'high', ward: 'Katraj', service: 'fuel', message: 'Fuel buffer critically low — 22h remaining. OMC advance delivery scheduled.', created_at: new Date(Date.now() - 0.5 * 3600000).toISOString(), channels: ['sms', 'push', 'iccc'], sent: 1200, delivered: 1147, read: 890 },
  { id: 'h2', severity: 'high', ward: 'Hadapsar', service: 'logistics', message: 'Transport strike disrupting fuel delivery routes. Expect 24–48h delay.', created_at: new Date(Date.now() - 2 * 3600000).toISOString(), channels: ['sms', 'whatsapp'], sent: 3200, delivered: 3100, read: 2780 },
  { id: 'h3', severity: 'moderate', ward: 'Swargate', service: 'food', message: 'PDS distribution delayed due to logistics disruption. Stock adequate for 5 days.', created_at: new Date(Date.now() - 4 * 3600000).toISOString(), channels: ['push', 'iccc'], sent: 900, delivered: 886, read: 710 },
  { id: 'h4', severity: 'moderate', ward: 'Pimpri', service: 'power', message: 'Grid demand at 94%. Conservation advisory: 6–10 PM.', created_at: new Date(Date.now() - 6 * 3600000).toISOString(), channels: ['push'], sent: 2800, delivered: 2750, read: 2200 },
  { id: 'h5', severity: 'low', ward: 'Kothrud', service: 'fuel', message: 'IOC Pune delivery incoming. Buffer to be replenished within 12 hours.', created_at: new Date(Date.now() - 10 * 3600000).toISOString(), channels: ['iccc'], sent: 0, delivered: 0, read: 0 },
  { id: 'h6', severity: 'high', ward: 'All Wards', service: 'fuel', message: 'Brent +3.2%. OMC advance payments activated. Monitor local fuel stocks.', created_at: new Date(Date.now() - 14 * 3600000).toISOString(), channels: ['sms', 'whatsapp', 'push', 'iccc'], sent: 15000, delivered: 14200, read: 11800 },
  { id: 'h7', severity: 'moderate', ward: 'Chinchwad', service: 'food', message: 'Grain delivery delayed by rain disruption. 2-day buffer maintained.', created_at: new Date(Date.now() - 20 * 3600000).toISOString(), channels: ['sms'], sent: 2400, delivered: 2310, read: 1980 },
  { id: 'h8', severity: 'low', ward: 'Aundh', service: 'power', message: 'Solar generation record: grid pressure eased. Normal supply guaranteed.', created_at: new Date(Date.now() - 24 * 3600000).toISOString(), channels: ['push'], sent: 1800, delivered: 1766, read: 1400 },
  { id: 'h9', severity: 'high', ward: 'Katraj', service: 'fuel', message: 'Fuel stocks at 18h buffer. Residents advised to refuel today.', created_at: new Date(Date.now() - 30 * 3600000).toISOString(), channels: ['sms', 'whatsapp'], sent: 1100, delivered: 1060, read: 880 },
  { id: 'h10', severity: 'moderate', ward: 'Hinjewadi', service: 'logistics', message: 'Ring road closure causing freight delay. 4–6 hours added transit time.', created_at: new Date(Date.now() - 36 * 3600000).toISOString(), channels: ['push', 'iccc'], sent: 700, delivered: 688, read: 560 },
  { id: 'h11', severity: 'low', ward: 'Baner', service: 'food', message: 'APMC arrivals normal. Food supply stable for next 14 days.', created_at: new Date(Date.now() - 48 * 3600000).toISOString(), channels: ['push'], sent: 1500, delivered: 1490, read: 1200 },
  { id: 'h12', severity: 'moderate', ward: 'Viman Nagar', service: 'power', message: 'Transformer maintenance scheduled. 2h planned outage tomorrow 10 AM.', created_at: new Date(Date.now() - 52 * 3600000).toISOString(), channels: ['sms', 'push'], sent: 1200, delivered: 1180, read: 1050 },
  { id: 'h13', severity: 'high', ward: 'Swargate', service: 'fuel', message: 'HPCL Swargate station out of stock. Next delivery in 6h.', created_at: new Date(Date.now() - 60 * 3600000).toISOString(), channels: ['sms'], sent: 850, delivered: 830, read: 710 },
  { id: 'h14', severity: 'low', ward: 'Koregaon Park', service: 'logistics', message: 'Road diversion complete. Normal freight routes restored.', created_at: new Date(Date.now() - 72 * 3600000).toISOString(), channels: ['iccc'], sent: 0, delivered: 0, read: 0 },
  { id: 'h15', severity: 'moderate', ward: 'Wakad', service: 'fuel', message: 'Fuel price revision effective tomorrow. Advisory for fleet operators.', created_at: new Date(Date.now() - 80 * 3600000).toISOString(), channels: ['push', 'whatsapp'], sent: 950, delivered: 940, read: 820 },
]

const SERVICE_COLORS = { fuel: '#F97316', power: '#FACC15', food: '#22C55E', logistics: '#6366F1' }

const CHANNEL_ICONS = { sms: '📱', whatsapp: '💬', push: '🔔', iccc: '🖥️' }

export default function AlertHistory() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const filtered = HISTORY.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    if (serviceFilter !== 'all' && a.service !== serviceFilter) return false
    if (search && !a.message.toLowerCase().includes(search.toLowerCase()) && !a.ward.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="bg-bg-card border border-border-default rounded-xl shadow-lg flex flex-col h-full">
      {/* Header & Filters */}
      <div className="px-4 pt-4 pb-3 border-b border-border-default flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-text-primary">Alert History</h3>
          <span className="text-xs font-mono text-text-muted">{filtered.length} records</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search alerts..."
              className="w-full bg-bg-elevated border border-border-default text-text-secondary text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-border-active"
            />
          </div>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-bg-elevated border border-border-default text-text-secondary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Severity</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value)}
            className="bg-bg-elevated border border-border-default text-text-secondary text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Services</option>
            <option value="fuel">Fuel</option>
            <option value="power">Power</option>
            <option value="food">Food</option>
            <option value="logistics">Logistics</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.map((a) => {
          const isOpen = expanded === a.id
          const svcColor = SERVICE_COLORS[a.service] || '#94A3B8'
          const borderColor = getSeverityColor(a.severity)
          return (
            <div
              key={a.id}
              className="mb-1.5 rounded-xl border border-border-default overflow-hidden"
              style={{ borderLeft: `3px solid ${borderColor}` }}
            >
              <button
                className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-bg-elevated/50 transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : a.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge severity={a.severity} />
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                      style={{ backgroundColor: `${svcColor}20`, color: svcColor }}
                    >
                      {a.service}
                    </span>
                    <span className="text-[10px] text-text-muted">{a.ward}</span>
                    <span className="text-[10px] font-mono text-text-muted ml-auto">
                      {formatRelativeTime(a.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate">{a.message}</p>
                </div>
                {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 pt-1 bg-bg-elevated/30 border-t border-border-default">
                  <p className="text-xs text-text-secondary mb-3">{a.message}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] text-text-muted mb-1">Channels</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {a.channels.map(ch => (
                          <span key={ch} className="text-xs bg-bg-primary px-2 py-0.5 rounded border border-border-default text-text-secondary">
                            {CHANNEL_ICONS[ch]} {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                    {a.sent > 0 && (
                      <div>
                        <div className="text-[10px] text-text-muted mb-1">Delivery Stats</div>
                        <div className="space-y-1">
                          {[
                            { label: 'Sent', value: a.sent, color: '#94A3B8' },
                            { label: 'Delivered', value: a.delivered, color: '#F59E0B' },
                            { label: 'Read', value: a.read, color: '#10B981' },
                          ].map(s => (
                            <div key={s.label} className="flex items-center gap-2 text-[10px]">
                              <span className="text-text-muted w-14">{s.label}</span>
                              <div className="flex-1 h-1 bg-bg-primary rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(s.value / a.sent) * 100}%`, backgroundColor: s.color }} />
                              </div>
                              <span className="font-mono" style={{ color: s.color }}>{s.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-[10px] text-text-muted font-mono">
                    {formatDate(a.created_at)}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
