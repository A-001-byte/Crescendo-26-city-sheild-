import { useCrisis } from '../../context/CrisisContext'
import { motion } from 'framer-motion'

const SEVERITY_CONFIG = {
  high: { bgClass: 'bg-error', textClass: 'text-on-error', label: 'HIGH RISK' },
  moderate: { bgClass: 'bg-tertiary-container', textClass: 'text-on-tertiary-container', label: 'MEDIUM RISK' },
  low: { bgClass: 'bg-primary', textClass: 'text-on-primary', label: 'LOW RISK' },
}

export default function AlertFeed() {
  const { alerts } = useCrisis()
  const items = (alerts || []).slice(0, 12)

  return (
    <div
      className="flex flex-col h-full rounded-[3rem] overflow-hidden isolate"
      style={{ background: '#FFFFFF', border: '1px solid #DBEAFE', boxShadow: '0 2px 16px rgba(59,130,246,0.07)' }}
    >
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #EFF6FF' }}
      >
        <h3 className="font-heading font-bold text-sm uppercase tracking-widest text-primary">Recent Alerts</h3>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{ background: '#EFF6FF', color: '#3B82F6' }}
        >
          {items.length} active
        </span>
      </div>

      <div className="flex-1 alert-feed-container px-4 pb-4 pt-2">
        {!items.length && (
          <div className="text-xs text-slate-500 py-6 text-center">No live alerts yet.</div>
        )}
        <div className="space-y-4">
          {items.map((alert, idx) => {
          const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className={`alert-item alert-capsule max-w-md mx-auto w-full flex items-center justify-center p-3 rounded-full shadow-sm cursor-default ${cfg.bgClass} ${cfg.textClass}`}
            >
              <span className="font-extrabold tracking-widest text-xs text-center uppercase">
                {cfg.label} — {(alert.ward || 'All Wards').toUpperCase()}
              </span>
            </motion.div>
          )
          })}
        </div>
      </div>
    </div>
  )
}
