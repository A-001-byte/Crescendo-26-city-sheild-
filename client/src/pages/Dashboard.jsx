import { useCrisis } from '../context/CrisisContext'
import CityRiskGauge from '../components/dashboard/CityRiskGauge'
import ServiceCards from '../components/dashboard/ServiceCards'
import RiskTimeline from '../components/dashboard/RiskTimeline'
import AlertFeed from '../components/dashboard/AlertFeed'
import AnimatedCounter from '../components/common/AnimatedCounter'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { getRiskColor, getRiskLabel } from '../utils/riskCalculations'
import { Shield, Radio, BarChart2, Clock } from 'lucide-react'

const STAT_CARDS = [
  { label: 'Active Alerts', value: 12, icon: Shield, color: '#EF4444' },
  { label: 'Zones Monitored', value: 48, icon: Radio, color: '#3B82F6' },
  { label: 'Events Analyzed', value: 1847, icon: BarChart2, color: '#8B5CF6' },
  { label: 'Uptime %', value: 99.7, icon: Clock, color: '#10B981', decimals: 1 },
]

export default function Dashboard() {
  const { score, services, loading, lastUpdated, alertLevel } = useCrisis()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const scoreColor = getRiskColor(score)

  return (
    <div className="p-4 space-y-4 h-full">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, decimals }) => (
          <div key={label} className="bg-bg-card border border-border-default rounded-xl p-3.5 shadow-lg flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-xl font-mono font-bold text-text-primary">
                <AnimatedCounter value={value} decimals={decimals || 0} />
                {decimals ? '' : ''}
              </div>
              <div className="text-xs text-text-muted">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(50vh - 80px)', minHeight: 240 }}>
        {/* Gauge */}
        <div className="col-span-4 bg-bg-card border border-border-default rounded-xl shadow-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-heading font-semibold text-text-secondary uppercase tracking-wider">City Risk Score</span>
            {lastUpdated && (
              <span className="text-[10px] font-mono text-text-muted">
                Updated {new Date(lastUpdated).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
              </span>
            )}
          </div>
          <div className="flex-1">
            <CityRiskGauge score={score} />
          </div>
        </div>

        {/* Service Cards */}
        <div className="col-span-8">
          <ServiceCards data={services} />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(50vh - 100px)', minHeight: 240 }}>
        <div className="col-span-8">
          <RiskTimeline />
        </div>
        <div className="col-span-4">
          <AlertFeed />
        </div>
      </div>
    </div>
  )
}
