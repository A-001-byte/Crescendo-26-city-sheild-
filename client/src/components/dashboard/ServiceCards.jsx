import { Flame, Zap, Wheat, Truck, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { getRiskColor } from '../../utils/riskCalculations'

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
  const color = getRiskColor(score)

  const DeltaIcon = delta > 0.05 ? TrendingUp : delta < -0.05 ? TrendingDown : Minus
  const deltaColor = delta > 0.05 ? '#EF4444' : delta < -0.05 ? '#10B981' : '#94A3B8'

  return (
    <div
      className="bg-bg-card border border-border-default rounded-xl p-4 shadow-lg transition-transform duration-200 hover:scale-[1.02] cursor-default"
      style={{
        borderLeft: `4px solid ${service.color}`,
        boxShadow: `0 0 0 0 ${service.color}`,
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 20px ${service.color}20`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.3)'}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${service.color}20` }}
          >
            <Icon className="w-4 h-4" style={{ color: service.color }} />
          </div>
          <span className="text-sm font-body font-medium text-text-secondary">{service.label}</span>
        </div>
        <div className="flex items-center gap-1" style={{ color: deltaColor }}>
          <DeltaIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-mono">
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <span
          className="text-3xl font-mono font-bold"
          style={{ color }}
        >
          {score.toFixed(1)}
        </span>
        <div style={{ width: 100, height: 36 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
              <defs>
                <linearGradient id={`grad-${service.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={service.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={service.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={service.color}
                strokeWidth={1.5}
                fill={`url(#grad-${service.key})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-1.5">
        <span className="text-xs text-text-muted font-mono">
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
