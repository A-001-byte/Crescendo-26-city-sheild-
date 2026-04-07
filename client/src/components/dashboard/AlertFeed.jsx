import { useCrisis } from '../../context/CrisisContext'
import { formatRelativeTime } from '../../utils/formatters'
import { getSeverityColor } from '../../utils/formatters'
import StatusBadge from '../common/StatusBadge'

const HARDCODED_ALERTS = [
  { id: 1, severity: 'high', message: 'Fuel buffer critically low in Katraj ward — 22h remaining', ward: 'Katraj', service: 'fuel', created_at: new Date(Date.now() - 8 * 60000).toISOString() },
  { id: 2, severity: 'high', message: 'Transport strike disrupting fuel delivery — Hadapsar affected', ward: 'Hadapsar', service: 'logistics', created_at: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: 3, severity: 'moderate', message: 'Swargate distribution center at 60% capacity', ward: 'Swargate', service: 'food', created_at: new Date(Date.now() - 55 * 60000).toISOString() },
  { id: 4, severity: 'moderate', message: 'Pimpri grid load at 94% — advisory issued', ward: 'Pimpri', service: 'power', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 5, severity: 'low', message: 'IOC Pune terminal delivery scheduled — buffer to be replenished', ward: 'Kothrud', service: 'fuel', created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: 6, severity: 'high', message: 'Brent crude +3.2% — OMC advance payments activated', ward: 'All Wards', service: 'fuel', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 7, severity: 'moderate', message: 'Food grain PDS distribution delayed — rain disruption', ward: 'Chinchwad', service: 'food', created_at: new Date(Date.now() - 7 * 3600000).toISOString() },
  { id: 8, severity: 'low', message: 'Solar generation record: grid pressure eased in Aundh', ward: 'Aundh', service: 'power', created_at: new Date(Date.now() - 10 * 3600000).toISOString() },
]

const SERVICE_COLORS = {
  fuel: '#F97316',
  power: '#FACC15',
  food: '#22C55E',
  logistics: '#6366F1',
}

export default function AlertFeed() {
  const { alerts } = useCrisis()
  const items = (alerts?.length ? alerts : HARDCODED_ALERTS).slice(0, 12)

  return (
    <div className="bg-bg-card border border-border-default rounded-xl shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <h3 className="font-heading font-semibold text-text-primary text-sm">Recent Alerts</h3>
        <span className="text-xs font-mono text-text-muted">{items.length} active</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {items.map((alert) => {
          const color = getSeverityColor(alert.severity)
          const svcColor = SERVICE_COLORS[alert.service] || '#94A3B8'
          return (
            <div
              key={alert.id}
              className="flex gap-3 px-2 py-2.5 rounded-lg hover:bg-bg-elevated/50 transition-colors mb-0.5"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 w-full">
                  <StatusBadge severity={alert.severity} />
                  <span className="text-[10px] font-mono text-text-muted ml-auto flex-shrink-0">
                    {formatRelativeTime(alert.created_at)}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-snug line-clamp-2">
                  {alert.message}
                </p>
                <div className="flex items-center gap-2">
                  {alert.ward && (
                    <span className="text-[10px] text-text-muted">{alert.ward}</span>
                  )}
                  {alert.service && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                      style={{ backgroundColor: `${svcColor}20`, color: svcColor }}
                    >
                      {alert.service}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
