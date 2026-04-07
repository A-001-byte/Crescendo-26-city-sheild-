import { useCrisis } from '../context/CrisisContext'
import CityRiskGauge from '../components/dashboard/CityRiskGauge'
import ServiceCards from '../components/dashboard/ServiceCards'
import RiskTimeline from '../components/dashboard/RiskTimeline'
import NewsFeed from '../components/dashboard/NewsFeed'
import CityMap from '../components/map/CityMap'
import AnimatedCounter from '../components/common/AnimatedCounter'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { getRiskColor } from '../utils/riskCalculations'
import { Shield, Radio, BarChart2, Clock } from 'lucide-react'

const STAT_CARDS = [
  { label: 'Active Alerts', value: 12, icon: Shield, color: '#EF4444' },
  { label: 'Zones Monitored', value: 48, icon: Radio, color: '#3B82F6' },
  { label: 'Events Analyzed', value: 1847, icon: BarChart2, color: '#8B5CF6' },
  { label: 'Uptime %', value: 99.7, icon: Clock, color: '#10B981', decimals: 1 },
]

export default function Dashboard() {
  const { score, services, loading, lastUpdated } = useCrisis()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      {/* Quick Stats Section */}
      <div className="w-full bg-white rounded-xl shadow-md p-4 z-0 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, decimals }) => (
            <div
              key={label}
              className="rounded-xl p-3.5 flex items-center gap-3 transition-colors hover:bg-gray-50 border border-gray-100"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <div className="text-xl font-mono font-bold text-gray-900">
                  <AnimatedCounter value={value} decimals={decimals || 0} />
                </div>
                <div className="text-xs text-gray-500 font-semibold">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gauge and Service Cards Section */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 z-0 relative">
        <div className="col-span-1 lg:col-span-4 bg-white rounded-xl shadow-md p-4 flex flex-col relative z-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">City Risk Score</span>
            {lastUpdated && (
              <span className="text-[10px] font-mono text-gray-400">
                Updated {new Date(lastUpdated).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
              </span>
            )}
          </div>
          <div className="flex-1 min-h-[200px]">
            <CityRiskGauge score={score} />
          </div>
        </div>

        <div className="col-span-1 lg:col-span-8 bg-white rounded-xl shadow-md p-4 relative z-0">
          <ServiceCards data={services} />
        </div>
      </div>

      {/* Timeline & News Feed Section */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 z-0 relative">
        <div className="col-span-1 lg:col-span-8 bg-white rounded-xl shadow-md p-4 flex flex-col relative z-0 min-h-[350px]">
          <RiskTimeline />
        </div>
        <div className="col-span-1 lg:col-span-4 relative z-0 flex flex-col">
          <NewsFeed />
        </div>
      </div>

      {/* Map Component Fix */}
      <div className="w-full bg-white rounded-xl shadow-md p-4 relative z-0">
        <div className="w-full h-[500px] rounded-xl overflow-hidden relative z-0">
          <CityMap />
        </div>
      </div>
    </div>
  )
}
