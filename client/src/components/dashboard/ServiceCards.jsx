import { Flame, Zap, Wheat, Truck, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { getRiskColor, getRiskLabel } from '../../utils/riskCalculations'

const SERVICES = [
  {
    key: 'fuel',
    label: 'Fuel Supply',
    icon: Flame,
    color: '#F97316',
    defaultScore: 7.1,
    defaultDelta: 0.3,
    defaultTrend: [6.2, 6.5, 6.8, 7.0, 6.9, 7.1, 7.3, 7.1, 7.2, 7.0, 7.1, 7.3, 7.1, 7.0, 6.9, 7.1, 7.2, 7.3, 7.1, 7.0, 7.2, 7.1, 7.3, 7.1],
  },
  {
    key: 'power',
    label: 'Power Grid',
    icon: Zap,
    color: '#FACC15',
    defaultScore: 4.3,
    defaultDelta: -0.5,
    defaultTrend: [5.1, 4.9, 4.8, 4.7, 4.6, 4.5, 4.4, 4.3, 4.2, 4.3, 4.4, 4.2, 4.3, 4.1, 4.2, 4.3, 4.4, 4.3, 4.2, 4.1, 4.3, 4.2, 4.3, 4.3],
  },
  {
    key: 'food',
    label: 'Food Chain',
    icon: Wheat,
    color: '#22C55E',
    defaultScore: 5.8,
    defaultDelta: 0.2,
    defaultTrend: [5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.7, 5.8, 5.9, 5.8, 5.7, 5.8, 5.9, 5.8, 5.7, 5.8, 5.9, 5.8, 5.8, 5.7, 5.8, 5.9, 5.8],
  },
  {
    key: 'logistics',
    label: 'Logistics',
    icon: Truck,
    color: '#6366F1',
    defaultScore: 6.2,
    defaultDelta: 0.0,
    defaultTrend: [6.0, 6.1, 6.2, 6.1, 6.2, 6.3, 6.2, 6.1, 6.2, 6.3, 6.2, 6.1, 6.2, 6.3, 6.2, 6.1, 6.2, 6.3, 6.2, 6.1, 6.2, 6.3, 6.2, 6.2],
  },
]

function ServiceCard({ service, data }) {
  const Icon = service.icon
  const score = data?.score ?? service.defaultScore
  const delta = typeof data?.delta === 'number' ? data.delta : service.defaultDelta
  const trendArr = Array.isArray(data?.trend) ? data.trend : service.defaultTrend
  const trend = trendArr.map((v) => ({ v }))
  const riskColor = getRiskColor(score)
  const cardBg = score >= 8 ? '#FEF2F2' : score >= 4 ? '#FEFCE8' : '#F0FDF4'

  const DeltaIcon = delta > 0.05 ? TrendingUp : delta < -0.05 ? TrendingDown : Minus
  const deltaColor = delta > 0.05 ? '#EF4444' : delta < -0.05 ? '#10B981' : '#94A3B8'

  return (
    <div
      className="p-4 flex flex-col justify-between cursor-default"
      style={{
        background: cardBg,
        border: `1px solid #E2E8F0`,
        borderLeft: `4px solid ${service.color}`,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{ backgroundColor: `${service.color}18` }}
          >
            <Icon className="w-4 h-4" style={{ color: service.color }} />
          </div>
          <span className="text-sm font-body font-semibold tracking-wide uppercase" style={{ color: '#334155' }}>{service.label}</span>
        </div>
        <div className="flex items-center gap-1" style={{ color: deltaColor }}>
          <DeltaIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span
            className="text-3xl font-mono font-bold"
            style={{ color: riskColor }}
          >
            {score.toFixed(1)}
          </span>
          <div className="text-[10px] mt-0.5 font-medium" style={{ color: riskColor }}>
            {getRiskLabel(score)}
          </div>
        </div>
        <div style={{ width: 100, height: 40 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
              <Area
                type="monotone"
                dataKey="v"
                stroke={service.color}
                strokeWidth={2}
                fill={service.color}
                fillOpacity={0.2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-2 pt-2" style={{ borderTop: '1px solid #F1F5F9' }}>
        <span className="text-[10px] font-mono" style={{ color: '#94A3B8' }}>
          {delta > 0.05 ? '▲' : delta < -0.05 ? '▼' : '—'} {Math.abs(delta).toFixed(1)} from 6h ago
        </span>
      </div>
    </div>
  )
}

export default function ServiceCards({ data }) {
  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      {SERVICES.map(s => (
        <ServiceCard key={s.key} service={s} data={data?.[s.key]} />
      ))}
    </div>
  )
}
